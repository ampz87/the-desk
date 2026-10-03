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
import { useResultsLog } from './hooks/useResultsLog'
import { useSignalAxios } from './hooks/useSignalAxios'
import { useGmailSyncStatus } from './hooks/useGmailSyncStatus'
import { useSignalLandscape } from './hooks/useSignalLandscape'
import { useSignalReadOfDay } from './hooks/useSignalReadOfDay'
import { useMockIC } from './hooks/useMockIC'
import { useQuiz } from './hooks/useQuiz'
import { useQuizConceptAccuracy } from './hooks/useQuizConceptAccuracy'
import { useBenchmarks } from './hooks/useBenchmarks'
import { useLandscapeNotes } from './hooks/useLandscapeNotes'
import { useStockWatchNotes } from './hooks/useStockWatchNotes'

function Desk() {
  const [activePanel, setActivePanel] = useState('today')
  const resultsLog = useResultsLog()
  const signalAxios = useSignalAxios()
  const gmailSyncStatus = useGmailSyncStatus()
  const signalLandscape = useSignalLandscape()
  const signalReadOfDay = useSignalReadOfDay()
  const mockIC = useMockIC()
  const quiz = useQuiz()
  const quizAccuracy = useQuizConceptAccuracy()
  const benchmarks = useBenchmarks()
  const landscapeNotes = useLandscapeNotes()
  const stockWatchNotes = useStockWatchNotes()

  return (
    <>
      <Header resultsSummary={resultsLog.summary} />
      <div className="shell">
        <Sidebar active={activePanel} onSelect={setActivePanel} />
        <main>
          {activePanel === 'today' && (
            <Today resultsLog={resultsLog} mockIC={mockIC} quiz={quiz} benchmarks={benchmarks} onGoto={setActivePanel} />
          )}
          {activePanel === 'life' && <LifePlan />}
          {activePanel === 'results' && <ResultsLog resultsLog={resultsLog} quizAccuracy={quizAccuracy} />}
          {activePanel === 'signal' && <Signal signalAxios={signalAxios} gmailSyncStatus={gmailSyncStatus} signalLandscape={signalLandscape} signalReadOfDay={signalReadOfDay} landscapeNotes={landscapeNotes} stockWatchNotes={stockWatchNotes} benchmarks={benchmarks} mockIC={mockIC} />}
          {activePanel === 'quiz' && <Quiz quiz={quiz} />}
          {activePanel === 'benchmarks' && <Benchmarks benchmarks={benchmarks} />}
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
