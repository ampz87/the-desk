import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useLifePlan() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('life_plan')
      .select('*')
      .order('updated_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setRows(data)
      })
    return () => { cancelled = true }
  }, [])

  return { rows, error, loading: rows === null && !error }
}
