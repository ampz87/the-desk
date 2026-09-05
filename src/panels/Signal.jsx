export default function Signal({ signal }) {
  const { row, error, loading } = signal

  return (
    <section className="panel active" id="signal">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 04</div>
          <h1 className="panel-title display">Signal</h1>
        </div>
        <div className="panel-sub">One digest, one read, a short watchlist. Curated, not comprehensive.</div>
      </div>

      {loading && <div className="state-note">Loading…</div>}
      {error && <div className="state-note error">Couldn't load signal: {error}</div>}
      {row === null && (
        <div className="empty-state">No signal_daily entries yet — add today's row in Supabase.</div>
      )}

      {row && (
        <div className="signal-row">
          <div className="signal-col">
            <div className="block">
              <div className="block-label">Axios PE/VC digest — {new Date(row.entry_date).toLocaleDateString()}</div>
              <div style={{ fontSize: '13.5px' }}>{row.digest_summary || 'No digest entered yet.'}</div>
            </div>
            {row.article_title && (
              <div className="block">
                <div className="block-label">Today's read</div>
                <a className="article-link" href={row.article_url || '#'} target="_blank" rel="noreferrer">{row.article_title}</a>
                <span className="article-src">{row.article_source}</span>
              </div>
            )}
          </div>
          <div className="signal-col">
            <div className="block">
              <div className="block-label">Stocks to watch this week</div>
              {(!row.stocks_to_watch || row.stocks_to_watch.length === 0) && (
                <div className="empty-state">No stocks listed for this entry.</div>
              )}
              {row.stocks_to_watch && row.stocks_to_watch.map((s, i) => (
                <div className="watch-row" key={i}>
                  <span className="watch-ticker">{s.ticker}</span>
                  <span className="watch-note">{s.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
