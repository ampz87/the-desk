import { useEffect, useState } from 'react'

export default function Benchmarks({ benchmarks }) {
  const { rows, sectors, error, loading } = benchmarks
  const [selectedSector, setSelectedSector] = useState(null)

  useEffect(() => {
    if (!selectedSector && sectors.length > 0) setSelectedSector(sectors[0])
  }, [sectors, selectedSector])

  const visibleRows = rows ? rows.filter((r) => r.sector === selectedSector) : []

  return (
    <section className="panel active" id="benchmarks">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 02</div>
          <h1 className="panel-title display">Benchmarks</h1>
        </div>
        <div className="panel-sub">Directional ranges with rationale — not verified data. Precision isn't the point, judgment is.</div>
      </div>

      {loading && <div className="state-note">Loading…</div>}
      {error && <div className="state-note error">Couldn't load benchmarks: {error}</div>}

      {sectors.length > 0 && (
        <div className="sector-pills">
          {sectors.map((s) => (
            <span
              key={s}
              className={`pill${s === selectedSector ? ' active' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedSector(s)}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {rows && rows.length === 0 && (
        <div className="empty-state">No benchmarks logged yet — use "Log to Benchmarks" from the Today dashboard to add the first one.</div>
      )}

      {visibleRows.length > 0 && (
        <div className="block">
          <table className="bench">
            <thead>
              <tr><th>Parameter</th><th>Ballpark range</th><th>Why this range</th></tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id}>
                  <td className="param">{row.parameter}</td>
                  <td className="range">{row.range_label}</td>
                  <td className="rationale">
                    {row.rationale}
                    {row.source && <div className="ic-deal-meta" style={{ marginTop: '4px' }}>Source: {row.source}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="variability-note">Parameter set varies by sector — ranges are ballpark by design, enough to sanity-check a claim, not to cite as fact.</div>
        </div>
      )}
    </section>
  )
}
