// Daily job: refresh a Gmail access token from the stored refresh_token,
// search for the most recent "Axios Pro Rata:" email, and store it raw
// (no summarization) in signal_axios_raw. Uses the Supabase service role
// key throughout since there's no logged-in app user in a cron context.

async function getAccessToken(env) {
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/gmail_oauth_tokens?select=refresh_token&order=created_at.desc&limit=1`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )
  const rows = await resp.json()
  if (!resp.ok) throw new Error(`Failed to read refresh token: ${JSON.stringify(rows)}`)
  if (!rows.length) throw new Error('No Gmail refresh token stored yet — complete the one-time consent flow at /api/gmail/auth first.')

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: rows[0].refresh_token,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  const tokenData = await tokenResp.json()
  if (!tokenResp.ok) throw new Error(`Failed to refresh access token: ${JSON.stringify(tokenData)}`)
  return tokenData.access_token
}

function decodeBase64Url(data) {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

function extractBody(payload) {
  let html = null
  let text = null

  function walk(part) {
    if (!part) return
    if (part.mimeType === 'text/html' && part.body?.data) html = decodeBase64Url(part.body.data)
    else if (part.mimeType === 'text/plain' && part.body?.data) text = decodeBase64Url(part.body.data)
    if (part.parts) part.parts.forEach(walk)
  }
  walk(payload)
  return { html, text }
}

async function fetchLatestAxiosEmail(accessToken) {
  const searchResp = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages?' +
      new URLSearchParams({ q: 'subject:"Axios Pro Rata:"', maxResults: '1' }),
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const searchData = await searchResp.json()
  if (!searchResp.ok) throw new Error(`Gmail search failed: ${JSON.stringify(searchData)}`)
  if (!searchData.messages || searchData.messages.length === 0) return null

  const messageId = searchData.messages[0].id
  const msgResp = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const msg = await msgResp.json()
  if (!msgResp.ok) throw new Error(`Gmail message fetch failed: ${JSON.stringify(msg)}`)

  const headers = msg.payload.headers || []
  const subject = headers.find((h) => h.name === 'Subject')?.value || '(no subject)'
  const dateHeader = headers.find((h) => h.name === 'Date')?.value
  const receivedAt = dateHeader ? new Date(dateHeader).toISOString() : new Date(Number(msg.internalDate)).toISOString()

  const { html, text } = extractBody(msg.payload)

  return { subject, receivedAt, bodyHtml: html, bodyText: text }
}

async function alreadyFetched(env, subject, receivedAt) {
  const resp = await fetch(
    `${env.SUPABASE_URL}/rest/v1/signal_axios_raw?select=id` +
      `&subject=eq.${encodeURIComponent(subject)}&received_at=eq.${encodeURIComponent(receivedAt)}`,
    {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  )
  const rows = await resp.json()
  if (!resp.ok) throw new Error(`Dedup check failed: ${JSON.stringify(rows)}`)
  return rows.length > 0
}

async function storeEmail(env, email) {
  const resp = await fetch(`${env.SUPABASE_URL}/rest/v1/signal_axios_raw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      subject: email.subject,
      received_at: email.receivedAt,
      body_html: email.bodyHtml,
      body_text: email.bodyText,
    }),
  })
  if (!resp.ok) throw new Error(`Failed to store email: ${await resp.text()}`)
}

async function syncOnce(env) {
  const accessToken = await getAccessToken(env)
  const email = await fetchLatestAxiosEmail(accessToken)
  if (!email) return 'No matching Axios Pro Rata email found.'

  if (await alreadyFetched(env, email.subject, email.receivedAt)) {
    return 'Latest matching email already stored — nothing new.'
  }

  await storeEmail(env, email)
  return `Stored new email: ${email.subject}`
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      syncOnce(env)
        .then((msg) => console.log(msg))
        .catch((err) => console.error('gmail-sync failed:', err.message))
    )
  },

  // Manual trigger for testing (GET /sync), plus a basic health check.
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/sync') {
      try {
        return new Response(await syncOnce(env), { status: 200 })
      } catch (err) {
        return new Response(`Error: ${err.message}`, { status: 500 })
      }
    }
    return new Response('the-desk-gmail-sync worker OK', { status: 200 })
  },
}
