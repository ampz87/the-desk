import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSignalLandscape() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('signal_landscape_items')
      .select('*')
      .order('fetched_at', { ascending: false })
      .limit(150)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setRows(data)
      })
    return () => { cancelled = true }
  }, [])

  const bySource = rows
    ? rows.reduce((acc, row) => {
        if (!acc[row.source]) acc[row.source] = []
        acc[row.source].push(row)
        return acc
      }, {})
    : null

  return { rows, bySource, error, loading: rows === null && !error }
}
