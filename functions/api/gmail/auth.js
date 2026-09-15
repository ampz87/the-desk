// Starts the one-time Gmail OAuth consent flow. Visiting this route redirects
// to Google's consent screen; Google then redirects back to callback.js.
export async function onRequestGet(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const redirectUri = `${url.origin}/api/gmail/callback`

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    access_type: 'offline',
    // Forces Google to reissue a refresh_token even if this account has
    // consented before — without this, a repeat consent can come back
    // with no refresh_token at all.
    prompt: 'consent',
  })

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302)
}
