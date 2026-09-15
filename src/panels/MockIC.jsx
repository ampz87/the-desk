import { useEffect, useState } from 'react'

const FACT_FIELDS = [
  ['round_size', 'Round size'],
  ['post_money', 'Post-money'],
  ['revenue', 'Revenue'],
  ['yoy_growth', 'YoY growth'],
  ['gross_margin', 'Gross margin'],
  ['lead_investor', 'Lead investor'],
]

export default function MockIC({ mockIC }) {
  const { deal, memo, backlog, error, loading, saveMemo, promote } = mockIC
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState('')
  const [promotingId, setPromotingId] = useState(null)
  const [promoteError, setPromoteError] = useState('')

  useEffect(() => {
    setDraft(memo ? memo.memo_text : '')
  }, [memo])

  async function handleSave() {
    setSaveState('saving')
    const { error } = await saveMemo(deal.id, deal.deal_name, draft)
    if (error) {
      setSaveState('error')
      setSaveError(error)
    } else {
      setSaveState('saved')
    }
  }

  async function handlePromote(id) {
    setPromotingId(id)
    setPromoteError('')
    const { error } = await promote(id)
    setPromotingId(null)
    if (error) setPromoteError(error)
  }

  return (
    <section className="panel active" id="mockic">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 03</div>
          <h1 className="panel-title display">Mock IC — this week</h1>
        </div>
        <div className="panel-sub">Raw deal facts only. The memo is yours to write — that's the muscle being built.</div>
      </div>

      {loading && <div className="state-note">Loading…</div>}
      {error && <div className="state-note error">Couldn't load Mock IC: {error}</div>}
      {deal === null && (
        <div className="empty-state">No active deal — add facts to mock_ic_deals in Supabase, or promote one from the backlog below.</div>
      )}

      {deal && (
        <div className="block">
          <div className="ic-deal-head">
            <div>
              <div className="ic-deal-name">{deal.deal_name}{deal.stage ? ` — ${deal.stage}` : ''}</div>
              <div className="ic-deal-meta">{[deal.sector, deal.location].filter(Boolean).join(' · ')}{deal.source_note ? ` · ${deal.source_note}` : ''}</div>
            </div>
          </div>
          <div className="ic-facts">
            {FACT_FIELDS.map(([key, label]) => (
              <div key={key}>
                <div className="ic-fact-label">{label}</div>
                <div className="ic-fact-value">{deal[key] || '—'}</div>
              </div>
            ))}
          </div>
          <div className="ic-prompt">{deal.memo_prompt || 'Write a one-page memo: thesis, key risks, and whether this pricing looks defensible against the benchmarks tab.'}</div>
          <textarea
            className="ic-memo"
            placeholder={'Thesis...\n\nKey risks...\n\nVerdict on pricing...'}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setSaveState('idle') }}
          />
          <div className="ic-save-row">
            <button className="ic-save-btn" onClick={handleSave} disabled={saveState === 'saving' || !draft.trim()}>
              {saveState === 'saving' ? 'Saving…' : memo ? 'Update memo' : 'Save memo'}
            </button>
            {saveState === 'saved' && <span className="ic-save-status success">Saved.</span>}
            {saveState === 'error' && <span className="ic-save-status error">Couldn't save: {saveError}</span>}
            {memo && saveState === 'idle' && <span className="ic-save-status">Last saved {new Date(memo.saved_at).toLocaleString()}</span>}
          </div>
        </div>
      )}

      {backlog && backlog.length > 0 && (
        <div className="block">
          <div className="block-label">Backlog</div>
          {promoteError && <div className="state-note error">Couldn't promote: {promoteError}</div>}
          {backlog.map((d) => (
            <div className="log-row" key={d.id}>
              <span>
                <span className="log-type">{d.stage || 'Deal'}</span>
                {' '}{d.deal_name}{d.sector ? ` — ${d.sector}` : ''}
              </span>
              <button className="save-btn" onClick={() => handlePromote(d.id)} disabled={promotingId === d.id}>
                {promotingId === d.id ? 'Promoting…' : 'Promote to active'}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
