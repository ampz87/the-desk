import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSignalAxios() {
  const [row, setRow] = useState(undefined) // undefined = loading, null = none found
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('signal_axios_raw')
      .select('*')
      .order('received_at', { ascending: false })
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
