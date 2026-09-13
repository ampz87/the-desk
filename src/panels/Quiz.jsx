import { useState } from 'react'

function pickRandom(list, excludeId) {
  if (!list || list.length === 0) return null
  if (list.length === 1) return list[0]
  let choice
  do {
    choice = list[Math.floor(Math.random() * list.length)]
  } while (choice.id === excludeId)
  return choice
}

function QuizTab({ questions, type, submitAnswer }) {
  const [current, setCurrent] = useState(() => pickRandom(questions))
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  if (!current) {
    return <div className="empty-state">No {type} questions yet — add some to quiz_questions in Supabase.</div>
  }

  async function handleSelect(optionId) {
    if (selected || saving) return
    setSelected(optionId)
    setSaving(true)
    const { error } = await submitAnswer(current.id, optionId, optionId === current.correct_option_id)
    setSaving(false)
    if (error) setSaveError(error)
  }

  function handleNext() {
    setCurrent(pickRandom(questions, current.id))
    setSelected(null)
    setSaveError('')
  }

  return (
    <div className="block">
      <div className={`quiz-meta${type === 'judgment' ? ' judgment' : ''}`}>
        {type === 'recall' ? 'Recall' : 'Judgment'} · {current.concept}
      </div>
      <div className="quiz-q">{current.prompt}</div>
      <div className="options">
        {current.options.map((opt) => {
          const isCorrect = opt.id === current.correct_option_id
          const isSelected = opt.id === selected
          let cls = 'option'
          if (selected) {
            if (isCorrect) cls += ' correct'
            else if (isSelected) cls += ' wrong'
          }
          return (
            <button key={opt.id} className={cls} disabled={!!selected} onClick={() => handleSelect(opt.id)}>
              {opt.text}
            </button>
          )
        })}
      </div>
      {selected && (
        <>
          <div className="quiz-explain">{current.explanation}</div>
          {saveError && <div className="state-note error">Answer not saved: {saveError}</div>}
          <button className="quiz-next-btn" onClick={handleNext}>Next question</button>
        </>
      )}
    </div>
  )
}

export default function Quiz({ quiz }) {
  const [tab, setTab] = useState('recall')
  const { questions, error, loading, submitAnswer } = quiz

  return (
    <section className="panel active" id="quiz">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 01</div>
          <h1 className="panel-title display">Quiz</h1>
        </div>
        <div className="panel-sub">Repeats are fine. This isn't about the score — it's about knowing where you're still soft.</div>
      </div>

      <div className="tabbar">
        <button className={`tabbtn${tab === 'recall' ? ' active' : ''}`} onClick={() => setTab('recall')}>Recall</button>
        <button className={`tabbtn${tab === 'judgment' ? ' active' : ''}`} onClick={() => setTab('judgment')}>Judgment</button>
      </div>

      {loading && <div className="state-note">Loading…</div>}
      {error && <div className="state-note error">Couldn't load quiz: {error}</div>}

      {questions && (
        <>
          <div className={`tabcontent${tab === 'recall' ? ' active' : ''}`}>
            <QuizTab questions={questions.recall} type="recall" submitAnswer={submitAnswer} />
          </div>
          <div className={`tabcontent${tab === 'judgment' ? ' active' : ''}`}>
            <QuizTab questions={questions.judgment} type="judgment" submitAnswer={submitAnswer} />
          </div>
        </>
      )}
    </section>
  )
}
