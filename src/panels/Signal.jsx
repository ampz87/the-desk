import { useState } from 'react'
import DOMPurify from 'dompurify'
import LogToBenchmarksModal from '../components/LogToBenchmarksModal'
import LogToMockICModal from '../components/LogToMockICModal'

export default function Signal({ signal, signalAxios, benchmarks, mockIC }) {
  const { row, error, loading } = signal
  const { row: axiosRow, error: axiosError, loading: axiosLoading } = signalAxios
  const [openModal, setOpenModal] = useState(null) // null | 'benchmarks' | 'mockic'

  const axiosSource = axiosRow
    ? `${axiosRow.subject} — ${new Date(axiosRow.received_at).toLocaleDateString()}`
    : ''

  return (
    <section className="panel active" id="signal">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 04</div>
          <h1 className="panel-title display">Signal</h1>
        </div>
        <div className="panel-sub">One digest, one read, a short watchlist. Curated, not comprehensive.</div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <a href="/api/gmail/auth" className="article-src">Connect / reconnect Gmail →</a>
      </div>

      <div className="signal-row">
        <div className="signal-col">
          <div className="block">
            <div className="block-label">Axios Pro Rata{axiosRow ? ` — ${new Date(axiosRow.received_at).toLocaleDateString()}` : ''}</div>
            {axiosLoading && <div className="state-note">Loading…</div>}
            {axiosError && <div className="state-note error">Couldn't load Axios email: {axiosError}</div>}
            {axiosRow === null && (
              <div className="empty-state">No Axios Pro Rata email fetched yet — this fills in automatically once Gmail sync runs.</div>
            )}
            {axiosRow && (
              <>
                <div className="ic-deal-meta" style={{ marginBottom: '10px' }}>{axiosRow.subject}</div>
                {axiosRow.body_html ? (
                  <div
                    style={{ fontSize: '13.5px', maxHeight: '480px', overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(axiosRow.body_html) }}
                  />
                ) : (
                  <div style={{ fontSize: '13.5px', whiteSpace: 'pre-wrap', maxHeight: '480px', overflowY: 'auto' }}>
                    {axiosRow.body_text || 'No content in this email.'}
                  </div>
                )}
                <div className="capture-row">
                  <button className="capture-btn" onClick={() => setOpenModal('benchmarks')}>Log to Benchmarks</button>
                  <button className="capture-btn" onClick={() => setOpenModal('mockic')}>Log to Mock IC</button>
                </div>
              </>
            )}
          </div>

          {loading && <div className="state-note">Loading…</div>}
          {error && <div className="state-note error">Couldn't load signal: {error}</div>}
          {row === null && (
            <div className="empty-state">No signal_daily entries yet — add today's row in Supabase.</div>
          )}
          {row && row.article_title && (
            <div className="block">
              <div className="block-label">Today's read</div>
              <a className="article-link" href={row.article_url || '#'} target="_blank" rel="noreferrer">{row.article_title}</a>
              <span className="article-src">{row.article_source}</span>
            </div>
          )}
        </div>
        <div className="signal-col">
          {row && (
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
          )}
        </div>
      </div>

      {openModal === 'benchmarks' && (
        <LogToBenchmarksModal
          defaultSource={axiosSource}
          onClose={() => setOpenModal(null)}
          onSaved={() => { setOpenModal(null); benchmarks.reload() }}
        />
      )}
      {openModal === 'mockic' && (
        <LogToMockICModal
          defaultSource={axiosSource}
          onClose={() => setOpenModal(null)}
          onSaved={() => { setOpenModal(null); mockIC.reload() }}
        />
      )}
    </section>
  )
}
