import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useQuizConceptAccuracy() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('quiz_answers')
      .select('is_correct, quiz_questions(concept)')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        else setRows(data)
      })
    return () => { cancelled = true }
  }, [])

  const loading = rows === null && !error

  const byConcept = rows
    ? Object.values(
        rows.reduce((acc, row) => {
          const concept = row.quiz_questions?.concept
          if (!concept) return acc
          if (!acc[concept]) acc[concept] = { concept, total: 0, correct: 0 }
          acc[concept].total += 1
          if (row.is_correct) acc[concept].correct += 1
          return acc
        }, {})
      )
        .map((c) => ({ ...c, accuracy: Math.round((c.correct / c.total) * 100) }))
        .sort((a, b) => b.accuracy - a.accuracy)
    : null

  return { byConcept, error, loading }
}
