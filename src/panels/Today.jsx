export default function Today({ lifePlan, resultsLog, signal, onGoto }) {
  const lifePlanCount = lifePlan.rows ? lifePlan.rows.length : null
  const totalLogged = resultsLog.rows ? resultsLog.rows.length : null
  const signalDate = signal.row ? new Date(signal.row.entry_date).toLocaleDateString() : null

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

        <div className="card disabled">
          <div className="card-top"><span className="card-title">Quiz</span><span className="card-tag soon">Coming soon</span></div>
          <div className="card-body">Daily recall + judgment reps on cap tables, comps, and deal mechanics.</div>
          <div className="card-stat">Phase 2</div>
        </div>

        <div className="card" onClick={() => onGoto('benchmarks')}>
          <div className="card-top"><span className="card-title">Benchmarks</span><span className="card-tag">Reference</span></div>
          <div className="card-body">Gross margin, CAC payback, ROCE ranges by sector — with rationale, not just numbers.</div>
          <div className="card-stat">1 / 5 sectors populated</div>
        </div>

        <div className="card disabled">
          <div className="card-top"><span className="card-title">Mock IC</span><span className="card-tag soon">Coming soon</span></div>
          <div className="card-body">Raw deal facts, memo writing practice — thesis, risks, and pricing verdict.</div>
          <div className="card-stat">Phase 2</div>
        </div>
      </div>
    </section>
  )
}
