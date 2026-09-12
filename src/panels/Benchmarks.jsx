const SECTORS = [
  { id: 'd2c', label: 'D2C / Consumer', populated: true },
  { id: 'infra', label: 'Infra / Defence', populated: false },
  { id: 'banking', label: 'Banking', populated: false },
  { id: 'energy', label: 'Energy', populated: false },
  { id: 'hardware', label: 'Hardware / Tech', populated: false },
]

const D2C_ROWS = [
  {
    param: 'Gross margin',
    range: '40–60%',
    rationale: 'Below 40% usually means heavy discounting or a weak supply chain position; above 60% is common only where brand premium is real, not promotional.',
  },
  {
    param: 'EBITDA %',
    range: '8–15%',
    rationale: 'Pre-scale D2C often runs thinner or negative; double digits sustained signals the growth spend is actually converting, not just buying revenue.',
  },
  {
    param: 'Marketing spend (% revenue)',
    range: '15–25%',
    rationale: 'Early-stage D2C leans higher to buy growth; above 30% sustained is a red flag on unit economics, not a growth signal.',
  },
  {
    param: 'CAC payback',
    range: '6–12 months',
    rationale: 'Longer than a year and the business is effectively financing its own growth — fine with strong repeat rates, risky without.',
  },
  {
    param: 'ROCE (at scale)',
    range: '15–20%',
    rationale: 'Anchor point borrowed from listed peer screening — same lens used on BEL/NTPC, applied to what a mature version of this business should look like.',
  },
  {
    param: 'ROA',
    range: '8–12%',
    rationale: 'Asset-light D2C should clear this comfortably; a miss here usually means inventory or working capital is heavier than the model assumes.',
  },
  {
    param: 'Revenue growth (YoY)',
    range: '50–100%+',
    rationale: 'Expected at Series A/B stage; deceleration below ~40% without a stated reason is worth probing in the memo.',
  },
  {
    param: 'Debt / Equity',
    range: '< 0.3x',
    rationale: 'Venture-backed D2C is usually equity-funded pre-scale; meaningful debt this early can mean working-capital strain, not leverage strategy.',
  },
  {
    param: 'Beta (if listed comp)',
    range: '0.8–1.3',
    rationale: 'Used only when benchmarking against a listed peer for volatility context — less relevant pre-IPO, more useful once comping against public consumer names.',
  },
]

export default function Benchmarks() {
  return (
    <section className="panel active" id="benchmarks">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 02</div>
          <h1 className="panel-title display">Benchmarks</h1>
        </div>
        <div className="panel-sub">Directional ranges with rationale — not verified data. Precision isn't the point, judgment is.</div>
      </div>

      <div className="sector-pills">
        {SECTORS.map((s) => (
          <span key={s.id} className={`pill${s.populated ? ' active' : ''}`} title={s.populated ? undefined : 'Not yet populated'}>
            {s.label}
          </span>
        ))}
      </div>

      <div className="block">
        <table className="bench">
          <thead>
            <tr><th>Parameter</th><th>Ballpark range</th><th>Why this range</th></tr>
          </thead>
          <tbody>
            {D2C_ROWS.map((row) => (
              <tr key={row.param}>
                <td className="param">{row.param}</td>
                <td className="range">{row.range}</td>
                <td className="rationale">{row.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="variability-note">Parameter set varies by sector — this is the fuller D2C/Consumer list; other sectors will swap in their own parameters (e.g. Banking would use NIM, CASA ratio, provisioning coverage) once populated. Ranges are ballpark by design — enough to sanity-check a claim, not to cite as fact.</div>
      </div>
    </section>
  )
}
