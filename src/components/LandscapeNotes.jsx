import { useState } from 'react'

export default function LandscapeNotes({ notes: notesData }) {
  const { notes, error, loading, addNote, deleteNote } = notesData
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleSave() {
    if (!draft.trim()) return
    setSaving(true)
    setSaveError('')
    const { error } = await addNote(draft.trim())
    setSaving(false)
    if (error) setSaveError(error)
    else setDraft('')
  }

  return (
    <div className="block">
      <div className="block-label">Notes</div>
      <textarea
        className="form-textarea"
        style={{ minHeight: '90px', marginBottom: '10px' }}
        placeholder="Thoughts, excerpts, anything worth keeping while you read…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <button className="btn-primary" onClick={handleSave} disabled={saving || !draft.trim()}>
        {saving ? 'Saving…' : 'Save note'}
      </button>
      {saveError && <div className="state-note error" style={{ marginTop: '8px' }}>Couldn't save: {saveError}</div>}

      <div style={{ marginTop: '18px' }}>
        {loading && <div className="state-note">Loading…</div>}
        {error && <div className="state-note error">Couldn't load notes: {error}</div>}
        {notes && notes.length === 0 && (
          <div className="empty-state">No notes yet — anything you write here shows up as a running list, newest first.</div>
        )}
        {notes && notes.map((note) => (
          <div className="note-row" key={note.id}>
            <div className="note-content">{note.content}</div>
            <div className="note-meta">
              <span className="note-date">{new Date(note.created_at).toLocaleString()}</span>
              <button className="note-delete-btn" onClick={() => deleteNote(note.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
