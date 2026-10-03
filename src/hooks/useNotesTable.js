import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Shared by Landscape Notes and the Stock-watch notepad — identical
// freeform-notes pattern (plain list, newest first, immediate delete),
// just pointed at different tables.
export function useNotesTable(tableName) {
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setNotes(data)
  }, [tableName])

  useEffect(() => { load() }, [load])

  const addNote = useCallback(async (content) => {
    const { error } = await supabase.from(tableName).insert({ content })
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }, [tableName, load])

  const deleteNote = useCallback(async (id) => {
    setNotes((current) => current ? current.filter((n) => n.id !== id) : current)
    const { error } = await supabase.from(tableName).delete().eq('id', id)
    if (error) {
      await load() // restore true state if the delete actually failed
      return { error: error.message }
    }
    return { error: null }
  }, [tableName, load])

  return { notes, error, loading: notes === null && !error, addNote, deleteNote }
}
