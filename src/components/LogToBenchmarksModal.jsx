import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const SECTORS = ['D2C / Consumer', 'Infra / Defence', 'Banking', 'Energy', 'Hardware / Tech']

export default function LogToBenchmarksModal({ defaultSource = '', onClose, onSaved }) {
  const [sector, setSector] = useState(SECTORS[0])
  const [parameter, setParameter] = useState('')
  const [rangeLabel, setRangeLabel] = useState('')
  const [rationale, setRationale] = useState('')
  const [source, setSource] = useState(defaultSource)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const { error } = await supabase.from('benchmarks').insert({
      sector,
      parameter,
      range_label: rangeLabel,
      rationale,
      source: source || null,
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
        <div className="modal-title display">Log to Benchmarks</div>
        <div className="modal-sub">Add a parameter/range you've come across, with your reasoning.</div>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label">Sector</label>
            <select className="auth-input" value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Parameter</label>
            <input className="auth-input" required value={parameter} onChange={(e) => setParameter(e.target.value)} placeholder="e.g. NIM" />
          </div>
          <div className="form-field">
            <label className="form-label">Ballpark range</label>
            <input className="auth-input" required value={rangeLabel} onChange={(e) => setRangeLabel(e.target.value)} placeholder="e.g. 3–4.5%" />
          </div>
          <div className="form-field">
            <label className="form-label">Why this range</label>
            <textarea className="form-textarea" required value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </div>
          <div className="form-field">
            <label className="form-label">Source</label>
            <input className="auth-input" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Axios Pro Rata — 14 Sep 2026" />
          </div>
          {error && <div className="state-note error">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
