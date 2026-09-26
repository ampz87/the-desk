import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useLandscapeNotes() {
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('landscape_notes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setNotes(data)
  }, [])

  useEffect(() => { load() }, [load])

  const addNote = useCallback(async (content) => {
    const { error } = await supabase.from('landscape_notes').insert({ content })
    if (error) return { error: error.message }
    await load()
    return { error: null }
  }, [load])

  const deleteNote = useCallback(async (id) => {
    setNotes((current) => current ? current.filter((n) => n.id !== id) : current)
    const { error } = await supabase.from('landscape_notes').delete().eq('id', id)
    if (error) {
      await load() // restore true state if the delete actually failed
      return { error: error.message }
    }
    return { error: null }
  }, [load])

  return { notes, error, loading: notes === null && !error, addNote, deleteNote }
}
