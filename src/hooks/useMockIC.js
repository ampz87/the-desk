import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useMockIC() {
  const [deal, setDeal] = useState(undefined) // undefined = loading, null = none found
  const [memo, setMemo] = useState(null) // existing memo row, or null if not yet written
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data: deals, error: dealError } = await supabase
      .from('mock_ic_deals')
      .select('*')
      .order('week_of', { ascending: false })
      .limit(1)

    if (dealError) {
      setError(dealError.message)
      return
    }

    const latestDeal = deals && deals.length ? deals[0] : null
    setDeal(latestDeal)

    if (latestDeal) {
      const { data: memoRow, error: memoError } = await supabase
        .from('mock_ic_memos')
        .select('*')
        .eq('deal_id', latestDeal.id)
        .maybeSingle()

      if (memoError) setError(memoError.message)
      else setMemo(memoRow)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const saveMemo = useCallback(async (dealId, dealName, text) => {
    const isFirstSave = !memo

    const { data: savedMemo, error: saveError } = await supabase
      .from('mock_ic_memos')
      .upsert({ deal_id: dealId, memo_text: text, saved_at: new Date().toISOString() }, { onConflict: 'deal_id' })
      .select()
      .single()

    if (saveError) return { error: saveError.message }
    setMemo(savedMemo)

    if (isFirstSave) {
      await supabase.from('results_log').insert({ metric_type: 'memo_written', label: dealName })
    }

    return { error: null }
  }, [memo])

  return { deal, memo, error, loading: deal === undefined && !error, saveMemo }
}
