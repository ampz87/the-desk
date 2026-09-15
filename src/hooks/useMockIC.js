import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useMockIC() {
  const [deal, setDeal] = useState(undefined) // undefined = loading, null = no active deal
  const [backlog, setBacklog] = useState(null)
  const [memo, setMemo] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    const { data: deals, error: dealsError } = await supabase
      .from('mock_ic_deals')
      .select('*')
      .order('week_of', { ascending: false })

    if (dealsError) {
      setError(dealsError.message)
      return
    }

    const activeDeal = deals.find((d) => d.status === 'active') || null
    setDeal(activeDeal)
    setBacklog(deals.filter((d) => d.status !== 'active'))

    if (activeDeal) {
      const { data: memoRow, error: memoError } = await supabase
        .from('mock_ic_memos')
        .select('*')
        .eq('deal_id', activeDeal.id)
        .maybeSingle()

      if (memoError) setError(memoError.message)
      else setMemo(memoRow)
    } else {
      setMemo(null)
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

  const promote = useCallback(async (dealId) => {
    // Demote the current active deal first — a partial unique index only
    // allows one row with status='active' at a time.
    const { error: demoteError } = await supabase
      .from('mock_ic_deals')
      .update({ status: 'backlog' })
      .eq('status', 'active')

    if (demoteError) return { error: demoteError.message }

    const { error: promoteError } = await supabase
      .from('mock_ic_deals')
      .update({ status: 'active' })
      .eq('id', dealId)

    if (promoteError) return { error: promoteError.message }

    await load()
    return { error: null }
  }, [load])

  return { deal, memo, backlog, error, loading: deal === undefined && !error, saveMemo, promote, reload: load }
}
