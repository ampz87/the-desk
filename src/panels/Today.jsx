import { useState } from 'react'
import LogToBenchmarksModal from '../components/LogToBenchmarksModal'
import LogToMockICModal from '../components/LogToMockICModal'

export default function Today({ lifePlan, resultsLog, signal, mockIC, quiz, benchmarks, onGoto }) {
  const [openModal, setOpenModal] = useState(null) // null | 'benchmarks' | 'mockic'
  const lifePlanCount = lifePlan.rows ? lifePlan.rows.length : null
  const totalLogged = resultsLog.rows ? resultsLog.rows.length : null
  const signalDate = signal.row ? new Date(signal.row.entry_date).toLocaleDateString() : null
  const mockICStat = mockIC.deal === undefined
    ? 'Loading…'
    : mockIC.deal === null
      ? 'No active deal'
      : mockIC.memo
        ? 'Memo saved this week'
        : `${mockIC.deal.deal_name} — memo not started`
  const quizStat = quiz.questions
    ? `${quiz.questions.recall.length} recall, ${quiz.questions.judgment.length} judgment`
    : 'Loading…'
  const benchmarksStat = benchmarks.sectors.length > 0
    ? `${benchmarks.sectors.length} / 5 sectors populated`
    : benchmarks.loading ? 'Loading…' : 'No benchmarks logged yet'

  return (
    <section className="panel active" id="today">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Daily glance</div>
          <h1 className="panel-title display">Today at the desk</h1>
        </div>
        <div className="panel-sub">One surface, six modules — VC/PE fluency built through daily reps, not a single build.</div>
      </div>

      <div className="grid">
        <div className="card" onClick={() => onGoto('life')}>
          <div className="card-top"><span className="card-title">Life plan</span><span className="card-tag">From Excel</span></div>
          <div className="card-body">Knowledge → VC angle → Wealth creation → Career angle — glance view of the four pillars.</div>
          <div className="card-stat">{lifePlanCount === null ? 'Loading…' : `${lifePlanCount} deliverables tracked`}</div>
        </div>

        <div className="card" onClick={() => onGoto('results')}>
          <div className="card-top"><span className="card-title">Results log</span><span className="card-tag">Real outcomes</span></div>
          <div className="card-body">Real trend lines on where you're actually improving — no streaks, just outcomes.</div>
          <div className="card-stat">{totalLogged === null ? 'Loading…' : `${totalLogged} entries logged`}</div>
        </div>

        <div className="card" onClick={() => onGoto('signal')}>
          <div className="card-top"><span className="card-title">Signal</span><span className="card-tag">Daily</span></div>
          <div className="card-body">Axios PE/VC digest, one read for the day, and stocks worth a look this week.</div>
          <div className="card-stat">{signalDate ? `Latest entry: ${signalDate}` : signal.loading ? 'Loading…' : 'No entry yet'}</div>
        </div>

        <div className="card" onClick={() => onGoto('quiz')}>
          <div className="card-top"><span className="card-title">Quiz</span><span className="card-tag">Daily reps</span></div>
          <div className="card-body">Daily recall + judgment reps on cap tables, comps, and deal mechanics.</div>
          <div className="card-stat">{quizStat}</div>
        </div>

        <div className="card" onClick={() => onGoto('benchmarks')}>
          <div className="card-top"><span className="card-title">Benchmarks</span><span className="card-tag">Reference</span></div>
          <div className="card-body">Gross margin, CAC payback, ROCE ranges by sector — with rationale, not just numbers.</div>
          <div className="card-stat">{benchmarksStat}</div>
        </div>

        <div className="card" onClick={() => onGoto('mockic')}>
          <div className="card-top"><span className="card-title">Mock IC</span><span className="card-tag">This week</span></div>
          <div className="card-body">Raw deal facts, memo writing practice — thesis, risks, and pricing verdict.</div>
          <div className="card-stat">{mockICStat}</div>
        </div>
      </div>

      <div className="block" style={{ marginTop: '16px' }}>
        <div className="block-label">Quick capture</div>
        <div className="capture-row">
          <button className="capture-btn" onClick={() => setOpenModal('benchmarks')}>Log to Benchmarks</button>
          <button className="capture-btn" onClick={() => setOpenModal('mockic')}>Log to Mock IC</button>
        </div>
      </div>

      {openModal === 'benchmarks' && (
        <LogToBenchmarksModal
          onClose={() => setOpenModal(null)}
          onSaved={() => { setOpenModal(null); benchmarks.reload() }}
        />
      )}
      {openModal === 'mockic' && (
        <LogToMockICModal
          onClose={() => setOpenModal(null)}
          onSaved={() => { setOpenModal(null); mockIC.reload() }}
        />
      )}
    </section>
  )
}
