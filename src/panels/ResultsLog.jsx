const METRIC_LABELS = {
  deal_analyzed: 'Deal analyzed',
  memo_written: 'Memo written',
  sector_covered: 'Sector covered',
}

export default function ResultsLog({ resultsLog }) {
  const { rows, summary, error, loading } = resultsLog

  return (
    <section className="panel active" id="results">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 05</div>
          <h1 className="panel-title display">Results log</h1>
        </div>
        <div className="panel-sub">Real outcomes over time — not a streak counter.</div>
      </div>

      {loading && <div className="state-note">Loading…</div>}
      {error && <div className="state-note error">Couldn't load results log: {error}</div>}

      {summary && (
        <div className="results-grid">
          <div className="stat-box"><div className="stat-num">{summary.dealsAnalyzed}</div><div className="stat-label">Deals analyzed</div></div>
          <div className="stat-box"><div className="stat-num">{summary.memosWritten}</div><div className="stat-label">Mock IC memos written</div></div>
          <div className="stat-box"><div className="stat-num">{summary.sectorsCovered}</div><div className="stat-label">Sectors covered</div></div>
        </div>
      )}

      <div className="block">
        <div className="block-label">Recent entries</div>
        {rows && rows.length === 0 && (
          <div className="empty-state">No entries in results_log yet — add rows in Supabase as you analyze deals, write memos, or cover sectors.</div>
        )}
        {rows && rows.slice(0, 15).map((row) => (
          <div className="log-row" key={row.id}>
            <span>
              <span className="log-type">{METRIC_LABELS[row.metric_type] || row.metric_type}</span>
              {row.label ? ` — ${row.label}` : ''}
            </span>
            <span className="log-date">{new Date(row.logged_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
