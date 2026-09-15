import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const FIELDS = [
  ['deal_name', 'Deal name', true],
  ['stage', 'Stage (e.g. Series B)', false],
  ['sector', 'Sector', false],
  ['location', 'Location', false],
  ['round_size', 'Round size', false],
  ['post_money', 'Post-money', false],
  ['revenue', 'Revenue', false],
  ['yoy_growth', 'YoY growth', false],
  ['gross_margin', 'Gross margin', false],
  ['lead_investor', 'Lead investor', false],
]

export default function LogToMockICModal({ defaultSource = '', onClose, onSaved }) {
  const [values, setValues] = useState({})
  const [sourceNote, setSourceNote] = useState(defaultSource)
  const [memoPrompt, setMemoPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(key, value) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('mock_ic_deals').insert({
      ...values,
      source_note: sourceNote || null,
      memo_prompt: memoPrompt || null,
    })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    onSaved()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title display">Log to Mock IC</div>
        <div className="modal-sub">Add a deal to the backlog — promote it to active from the Mock IC tab when you're ready to memo it.</div>
        <form onSubmit={handleSubmit}>
          {FIELDS.map(([key, label, required]) => (
            <div className="form-field" key={key}>
              <label className="form-label">{label}</label>
              <input
                className="auth-input"
                required={required}
                value={values[key] || ''}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
          <div className="form-field">
            <label className="form-label">Memo prompt (optional — leave blank for the default)</label>
            <textarea className="form-textarea" value={memoPrompt} onChange={(e) => setMemoPrompt(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Source</label>
            <input className="auth-input" value={sourceNote} onChange={(e) => setSourceNote(e.target.value)} placeholder="e.g. Axios Pro Rata — 14 Sep 2026" />
          </div>
          {error && <div className="state-note error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save to backlog'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
