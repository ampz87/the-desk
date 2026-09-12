import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useQuiz() {
  const [questions, setQuestions] = useState(null) // { recall: [...], judgment: [...] }
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('quiz_questions')
      .select('*')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setError(error.message)
          return
        }
        setQuestions({
          recall: data.filter((q) => q.question_type === 'recall'),
          judgment: data.filter((q) => q.question_type === 'judgment'),
        })
      })
    return () => { cancelled = true }
  }, [])

  const submitAnswer = useCallback(async (questionId, selectedOptionId, isCorrect) => {
    const { error } = await supabase.from('quiz_answers').insert({
      question_id: questionId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
    })
    return { error: error ? error.message : null }
  }, [])

  return { questions, error, loading: questions === null && !error, submitAnswer }
}
