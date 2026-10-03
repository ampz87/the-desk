import { useState } from 'react'

// Shared by Landscape Notes and the Stock-watch notepad — same plain
// running-list pattern, parameterized so the two stay visually distinct
// (different label/placeholder, and used in different tabs) without
// duplicating the save/delete logic.
export default function NotesBlock({ notes: notesData, label = 'Notes', placeholder = 'Write a note…' }) {
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
      <div className="block-label">{label}</div>
      <textarea
        className="form-textarea"
        style={{ minHeight: '90px', marginBottom: '10px' }}
        placeholder={placeholder}
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
