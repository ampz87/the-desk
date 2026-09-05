import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return
    setStatus('sending')
    setErrorMsg('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-wordmark">THE DESK <span>study, mkt II</span></div>
        <div className="auth-sub">Sign in with a magic link sent to your email.</div>
        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'sending' || status === 'sent'}
          />
          <button
            className="auth-btn"
            type="submit"
            disabled={status === 'sending' || status === 'sent'}
          >
            {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Link sent' : 'Send magic link'}
          </button>
        </form>
        {status === 'sent' && (
          <div className="auth-msg success">Check your inbox for the sign-in link.</div>
        )}
        {status === 'error' && (
          <div className="auth-msg error">{errorMsg}</div>
        )}
      </div>
    </div>
  )
}
