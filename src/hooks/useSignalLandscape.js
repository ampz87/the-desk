import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Matches the Worker's retention window (it deletes anything older than
// this too) — Landscape is meant to read as "what's current," not an
// archive, so the two stay consistent rather than the display quietly
// drifting older as the table grows.
const WINDOW_HOURS = 48

export function useSignalLandscape() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const cutoff = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString()
    supabase
      .from('signal_landscape_items')
      .select('*')
      .gte('fetched_at', cutoff)
      .order('fetched_at', { ascending: false })
      .limit(500)
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
