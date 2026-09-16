import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Cron runs daily — anything older than this without a fresh run means the
// Worker has stopped succeeding (most likely cause: a Testing-mode Google
// OAuth app's refresh token expiring after 7 days).
const STALE_AFTER_HOURS = 36

export function useGmailSyncStatus() {
  const [row, setRow] = useState(undefined) // undefined = loading, null = no runs yet
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('gmail_sync_status')
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setRow(data && data.length ? data[0] : null)
      })
    return () => { cancelled = true }
  }, [])

  const isStale = row
    ? !row.success || (Date.now() - new Date(row.ran_at).getTime()) > STALE_AFTER_HOURS * 3600 * 1000
    : false

  return { row, error, loading: row === undefined && !error, isStale }
}
