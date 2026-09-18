// Daily job: fetch a handful of RSS feeds, parse new items, tag each with a
// crude keyword-based region guess, and store them raw (no summarization,
// no LLM calls) in signal_landscape_items. Dedup relies on a unique
// constraint on `url` plus Postgres's ignore-duplicates upsert behavior —
// simpler and safer than a hand-rolled existence check.
//
// Source list — confirmed by live-testing during build (see commit
// message / project README for what didn't work and why):
//   - PIB (pib.gov.in) dropped: no ministry-specific feeds exist (Regid is
//     a regional bureau, not a ministry), and the only feed with any items
//     returns Hindi text regardless of the Lang parameter — unusable for
//     English keyword region-tagging anyway.
//   - Reuters dropped: no working public RSS feed exists any more.
//   - Replaced with Business Standard Economy (India) and Nikkei Asia
//     (strongest of the tested alternatives for China coverage).

import { parseFeedItems } from './rss.js'

const LANDSCAPE_SOURCES = [
  { name: 'Economic Times Markets', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
  { name: 'Business Standard Economy', url: 'https://www.business-standard.com/rss/economy-102.rss' },
  { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar' },
]

// Crude, transparent, keyword-only — not semantic understanding. First
// matching region wins; no match leaves region_tag null rather than guessing.
const REGION_KEYWORDS = {
  India: ['RBI', 'India', 'Rupee', 'Sebi', 'Sensex', 'Nifty', 'Modi', 'Lok Sabha', 'New Delhi'],
  US: ['Fed', 'Washington', 'United States', 'Trump', 'White House', 'Wall Street', 'Nasdaq', 'S&P 500'],
  China: ['Beijing', 'Yuan', 'China', 'Xi Jinping', 'PBOC', 'Shanghai', 'Renminbi'],
}

function tagRegion(headline) {
  const lower = headline.toLowerCase()
  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) return region
  }
  return null
}

// A bot-identifying UA (e.g. "TheDeskBot/1.0") gets a 403 from Business
// Standard's anti-bot protection — confirmed by testing both against the
// live feed. A realistic browser UA is required, not just polite practice.
async function fetchSource(source) {
  const resp = await fetch(source.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' },
  })
  if (!resp.ok) throw new Error(`${source.name}: fetch failed with HTTP ${resp.status}`)
  const xml = await resp.text()
  return parseFeedItems(xml).map((item) => ({
    source: source.name,
    headline: item.title,
    url: item.url,
    published_at: item.publishedAt,
    region_tag: tagRegion(item.title),
  }))
}

// Insert with on_conflict=url + ignore-duplicates: rows whose url already
// exists are silently skipped by Postgres, no separate existence check
// needed. Returns how many rows Postgres actually accepted as new.
async function storeItems(env, rows) {
  if (rows.length === 0) return 0
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/signal_landscape_items?on_conflict=url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'resolution=ignore-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  })
  if (!resp.ok) throw new Error(`Failed to store landscape items: ${await resp.text()}`)
  const inserted = await resp.json()
  return inserted.length
}

const RETENTION_HOURS = 48

// Landscape is meant to read as "what's current," not an archive — nothing
// prunes itself otherwise, since dedup only skips re-inserting a url, it
// never removes old rows. Deletes anything older than the same 48h window
// the frontend filters its display to, so storage stays bounded and the
// two are never inconsistent with each other.
async function pruneOldItems(env) {
  const cutoff = new Date(Date.now() - RETENTION_HOURS * 3600 * 1000).toISOString()
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/signal_landscape_items?fetched_at=lt.${encodeURIComponent(cutoff)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=representation',
      },
    }
  )
  if (!resp.ok) throw new Error(`Failed to prune old landscape items: ${await resp.text()}`)
  const deleted = await resp.json()
  return deleted.length
}

export async function syncLandscapeOnce(env) {
  const results = []
  for (const source of LANDSCAPE_SOURCES) {
    try {
      const items = await fetchSource(source)
      const insertedCount = await storeItems(env, items)
      results.push(`${source.name}: ${insertedCount} new / ${items.length} fetched`)
    } catch (err) {
      results.push(`${source.name}: FAILED — ${err.message}`)
    }
  }

  try {
    const deletedCount = await pruneOldItems(env)
    results.push(`Pruned ${deletedCount} items older than ${RETENTION_HOURS}h`)
  } catch (err) {
    results.push(`Prune FAILED — ${err.message}`)
  }

  return results.join('; ')
}
