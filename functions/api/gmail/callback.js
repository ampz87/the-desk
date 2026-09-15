// Handles Google's redirect back after consent: exchanges the auth code for
// tokens and stores the refresh_token in Supabase (service role, since this
// runs with no logged-in app user). The access_token from this exchange is
// discarded — the cron Worker re-derives a fresh one from the refresh_token
// on every run.
function htmlResponse(body, status = 200) {
  return new Response(
    `<html><body style="font-family:system-ui,sans-serif;padding:40px;max-width:520px;margin:0 auto;">${body}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function onRequestGet(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const oauthError = url.searchParams.get('error')

  if (oauthError) {
    return htmlResponse(`<h2>Gmail connection failed</h2><p>Google returned: ${oauthError}</p>`, 400)
  }
  if (!code) {
    return htmlResponse('<h2>Gmail connection failed</h2><p>Missing authorization code.</p>', 400)
  }

  const redirectUri = `${url.origin}/api/gmail/callback`

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenResp.json()

  if (!tokenResp.ok || !tokenData.refresh_token) {
    return htmlResponse(
      `<h2>Gmail connection failed</h2><p>${JSON.stringify(tokenData)}</p>` +
      `<p>If refresh_token is missing, this Google account may have already granted consent before. ` +
      `Revoke access at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> and try again.</p>`,
      400
    )
  }

  const storeResp = await fetch(`${env.SUPABASE_URL}/rest/v1/gmail_oauth_tokens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ refresh_token: tokenData.refresh_token }),
  })

  if (!storeResp.ok) {
    return htmlResponse(`<h2>Gmail connection failed</h2><p>Token received but couldn't be stored: ${await storeResp.text()}</p>`, 500)
  }

  return htmlResponse('<h2>Gmail connected ✓</h2><p>Refresh token stored. The daily sync will start picking up new Axios Pro Rata emails.</p><p><a href="/">Back to The Desk</a></p>')
}
