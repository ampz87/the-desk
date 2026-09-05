export default function LifePlan({ lifePlan }) {
  const { rows, error, loading } = lifePlan

  return (
    <section className="panel active" id="life">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 06</div>
          <h1 className="panel-title display">Life plan</h1>
        </div>
        <div className="panel-sub">Glance view only — the Excel sheet stays the source of truth.</div>
      </div>

      <div className="block">
        {loading && <div className="state-note">Loading…</div>}
        {error && <div className="state-note error">Couldn't load life plan: {error}</div>}
        {rows && rows.length === 0 && (
          <div className="empty-state">No rows in life_plan yet — add entries in Supabase.</div>
        )}
        {rows && rows.length > 0 && (
          <table className="lifeplan">
            <thead>
              <tr><th>Pillar</th><th>Deliverable</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="lp-pillar">{row.pillar}</td>
                  <td className="lp-item">{row.deliverable}</td>
                  <td className="lp-status">{row.status}</td>
                  <td className="lp-note">{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="source-note">Direct mirror of your life-planning Excel sheet. Edit the sheet, not this view.</div>
      </div>
    </section>
  )
}
