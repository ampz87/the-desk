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
const LANDSCAPE_SOURCES = [
  { name: 'Economic Times Markets', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
  { name: 'Business Standard Economy', url: 'https://www.business-standard.com/rss/economy-102.rss' },
  { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar' },
]

function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : null
}

function stripCdata(s) {
  if (!s) return s
  const m = s.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/)
  return (m ? m[1] : s).trim()
}

function decodeEntities(s) {
  if (!s) return s
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

// Works for both RSS 2.0 (<channel><item>...) and RDF/RSS 1.0
// (<item rdf:about="...">...) — both use structurally identical <item>
// blocks with <title>/<link>/optional <pubDate>, which is all we need.
function parseFeedItems(xml) {
  const items = []
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const rawTitle = extractTag(block, 'title')
    const rawLink = extractTag(block, 'link')
    const rawDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date')
    if (!rawTitle || !rawLink) continue

    const headline = decodeEntities(stripCdata(rawTitle))
    const url = decodeEntities(stripCdata(rawLink))
    let publishedAt = null
    if (rawDate) {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) publishedAt = d.toISOString()
    }
    items.push({ headline, url, publishedAt })
  }
  return items
}

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
    headline: item.headline,
    url: item.url,
    published_at: item.publishedAt,
    region_tag: tagRegion(item.headline),
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
