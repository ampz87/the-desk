// Daily job: pick one article link from a curated set of sources — no
// summarization, no LLM, mechanical selection only. Runs as part of the
// same daily cron as Gmail sync and Landscape (see index.js), one more
// data source and table rather than a second scheduled job.
//
// Source list — confirmed by live-testing during build:
//   - Daily Stoic (dailystoic.com) dropped: its /feed/ is real and is the
//     site's own canonical feed (confirmed via auto-discovery), but every
//     item in it is dated 2021-2023 — the feed itself has gone stale, not
//     a broken URL. Replaced with The Marginalian (themarginalian.org),
//     a same-spirit reflective-essay source confirmed actively publishing.
//   - Collaborative Fund isn't on WordPress like the others — its feed is
//     at /feed.xml (a Siteleaf-generated site), not /feed/, which 404s.
//   - Marginal Revolution removed after launch: its feed is mostly link-
//     roundup posts pointing to other (often paywalled) outlets like FT,
//     not original MR content — it was surfacing paywalled articles under
//     MR's name. Dropped rather than trying to filter its feed.
//   - The other 4 (Farnam Street, Of Dollars and Data, Ness Labs,
//     Stratechery) all resolved at the expected WordPress-convention
//     /feed/ path with fresh content.

import { parseFeedItems } from './rss.js'

const READ_SOURCES = [
  { name: 'Farnam Street', url: 'https://fs.blog/feed/' },
  { name: 'Of Dollars and Data', url: 'https://ofdollarsanddata.com/feed/' },
  { name: 'The Marginalian', url: 'https://www.themarginalian.org/feed/' },
  { name: 'Collaborative Fund', url: 'https://www.collaborativefund.com/feed.xml' },
  { name: 'Ness Labs', url: 'https://nesslabs.com/feed' },
  { name: 'Stratechery', url: 'https://stratechery.com/feed/' },
]

// "Roughly the last 7 days" per the brief — wide enough that a slower-
// publishing source (e.g. Of Dollars and Data, ~weekly) still gets a fair
// shot at being picked, not just whichever feed happened to post today.
const CANDIDATE_WINDOW_DAYS = 7

async function fetchSource(source) {
  const resp = await fetch(source.url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36' },
  })
  if (!resp.ok) throw new Error(`${source.name}: fetch failed with HTTP ${resp.status}`)
  const xml = await resp.text()
  return parseFeedItems(xml).map((item) => ({
    source: source.name,
    title: item.title,
    url: item.url,
    published_at: item.publishedAt,
  }))
}

async function fetchExistingUrls(env) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/signal_read_of_day?select=url`, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  })
  const rows = await resp.json()
  if (!resp.ok) throw new Error(`Failed to read existing read-of-day urls: ${JSON.stringify(rows)}`)
  return new Set(rows.map((r) => r.url))
}

async function insertReadOfDay(env, item) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/signal_read_of_day`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      source: item.source,
      title: item.title,
      url: item.url,
      published_at: item.published_at,
    }),
  })
  if (!resp.ok) throw new Error(`Failed to store read-of-day: ${await resp.text()}`)
}

export async function syncTodaysReadOnce(env) {
  const existingUrls = await fetchExistingUrls(env)
  const cutoffMs = Date.now() - CANDIDATE_WINDOW_DAYS * 24 * 3600 * 1000

  const allItems = []
  const errors = []
  for (const source of READ_SOURCES) {
    try {
      allItems.push(...(await fetchSource(source)))
    } catch (err) {
      errors.push(`${source.name}: ${err.message}`)
    }
  }

  const candidates = allItems.filter((item) => {
    if (!item.published_at) return false
    if (existingUrls.has(item.url)) return false
    return new Date(item.published_at).getTime() >= cutoffMs
  })

  if (candidates.length === 0) {
    return ['No new candidates — showing no new read today (by design, not a bug).', ...errors].join('; ')
  }

  // Most recently published wins — no personalization, no weighting.
  candidates.sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
  const chosen = candidates[0]
  await insertReadOfDay(env, chosen)

  return [`Selected: "${chosen.title}" (${chosen.source})`, ...errors].join('; ')
}
