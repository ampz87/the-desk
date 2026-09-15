import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useBenchmarks() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('benchmarks')
      .select('*')
      .order('sector', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) setError(error.message)
    else setRows(data)
  }, [])

  useEffect(() => { load() }, [load])

  const sectors = rows ? [...new Set(rows.map((r) => r.sector))] : []

  return { rows, sectors, error, loading: rows === null && !error, reload: load }
}
