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
  const { deal, memo, error, loading, saveMemo } = mockIC
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error
  const [saveError, setSaveError] = useState('')

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
        <div className="empty-state">No deal in mock_ic_deals yet — add this week's facts in Supabase.</div>
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
    </section>
  )
}
