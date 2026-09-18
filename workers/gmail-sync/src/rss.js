// Minimal, dependency-free RSS/RDF item extraction shared by the Landscape
// and Today's Read jobs. Regex-based rather than a full XML parser — RSS
// <item> blocks are structurally stable enough (title/link/optional date)
// that this is reliable in practice and avoids pulling in an XML library
// for a Worker that otherwise has zero npm dependencies.

export function extractTag(block, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : null
}

export function stripCdata(s) {
  if (!s) return s
  const m = s.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/)
  return (m ? m[1] : s).trim()
}

export function decodeEntities(s) {
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
export function parseFeedItems(xml) {
  const items = []
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const rawTitle = extractTag(block, 'title')
    const rawLink = extractTag(block, 'link')
    const rawDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date')
    if (!rawTitle || !rawLink) continue

    const title = decodeEntities(stripCdata(rawTitle))
    const url = decodeEntities(stripCdata(rawLink))
    let publishedAt = null
    if (rawDate) {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) publishedAt = d.toISOString()
    }
    items.push({ title, url, publishedAt })
  }
  return items
}
