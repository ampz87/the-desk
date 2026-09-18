import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSignalReadOfDay() {
  const [row, setRow] = useState(undefined) // undefined = loading, null = none yet
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('signal_read_of_day')
      .select('*')
      .order('shown_on', { ascending: false })
      .order('fetched_at', { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setRow(data && data.length ? data[0] : null)
      })
    return () => { cancelled = true }
  }, [])

  return { row, error, loading: row === undefined && !error }
}
