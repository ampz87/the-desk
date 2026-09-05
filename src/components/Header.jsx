import { supabase } from '../lib/supabaseClient'

const today = new Date()
const headerDate = today.toLocaleDateString('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export default function Header({ resultsSummary }) {
  return (
    <header className="desk-header">
      <div className="header-top">
        <div className="wordmark">THE DESK <span>study, mkt II</span></div>
        <div className="header-right">
          <div className="header-date">{headerDate}</div>
          <button className="header-signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
      <div className="ledger-tape">
        <div className="ledger-item">
          <span className="ledger-label">Deals analyzed</span>
          <span className="ledger-value">{resultsSummary ? resultsSummary.dealsAnalyzed : '—'}</span>
        </div>
        <div className="ledger-item">
          <span className="ledger-label">Mock IC memos written</span>
          <span className="ledger-value">{resultsSummary ? resultsSummary.memosWritten : '—'}</span>
        </div>
        <div className="ledger-item">
          <span className="ledger-label">Sectors covered</span>
          <span className="ledger-value">{resultsSummary ? resultsSummary.sectorsCovered : '—'}</span>
        </div>
      </div>
    </header>
  )
}
