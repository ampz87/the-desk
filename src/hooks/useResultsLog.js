import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useResultsLog() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('results_log')
      .select('*')
      .order('logged_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setRows(data)
      })
    return () => { cancelled = true }
  }, [])

  const loading = rows === null && !error
  const summary = rows
    ? {
        dealsAnalyzed: rows.filter((r) => r.metric_type === 'deal_analyzed').length,
        memosWritten: rows.filter((r) => r.metric_type === 'memo_written').length,
        sectorsCovered: new Set(
          rows.filter((r) => r.metric_type === 'sector_covered').map((r) => r.label)
        ).size,
      }
    : null

  return { rows, summary, error, loading }
}
