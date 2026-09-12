import { useState } from 'react'
import { useSession } from './auth/useSession'
import Login from './auth/Login'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Today from './panels/Today'
import LifePlan from './panels/LifePlan'
import ResultsLog from './panels/ResultsLog'
import Signal from './panels/Signal'
import Benchmarks from './panels/Benchmarks'
import MockIC from './panels/MockIC'
import Quiz from './panels/Quiz'
import { useLifePlan } from './hooks/useLifePlan'
import { useResultsLog } from './hooks/useResultsLog'
import { useSignalLatest } from './hooks/useSignalLatest'
import { useMockIC } from './hooks/useMockIC'
import { useQuiz } from './hooks/useQuiz'
import { useQuizConceptAccuracy } from './hooks/useQuizConceptAccuracy'

function Desk() {
  const [activePanel, setActivePanel] = useState('today')
  const lifePlan = useLifePlan()
  const resultsLog = useResultsLog()
  const signal = useSignalLatest()
  const mockIC = useMockIC()
  const quiz = useQuiz()
  const quizAccuracy = useQuizConceptAccuracy()

  return (
    <>
      <Header resultsSummary={resultsLog.summary} />
      <div className="shell">
        <Sidebar active={activePanel} onSelect={setActivePanel} />
        <main>
          {activePanel === 'today' && (
            <Today lifePlan={lifePlan} resultsLog={resultsLog} signal={signal} mockIC={mockIC} quiz={quiz} onGoto={setActivePanel} />
          )}
          {activePanel === 'life' && <LifePlan lifePlan={lifePlan} />}
          {activePanel === 'results' && <ResultsLog resultsLog={resultsLog} quizAccuracy={quizAccuracy} />}
          {activePanel === 'signal' && <Signal signal={signal} />}
          {activePanel === 'quiz' && <Quiz quiz={quiz} />}
          {activePanel === 'benchmarks' && <Benchmarks />}
          {activePanel === 'mockic' && <MockIC mockIC={mockIC} />}
        </main>
      </div>
      <footer className="desk-footer">The Desk — a personal PE/VC study surface.</footer>
    </>
  )
}

export default function App() {
  const session = useSession()

  if (session === undefined) {
    return <div className="auth-shell"><div style={{ color: '#fff' }}>Loading…</div></div>
  }

  if (session === null) {
    return <Login />
  }

  return <Desk />
}
