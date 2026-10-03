const SHEET_EMBED_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjFOZTOyCOgmmwx9wX7QfDo-50yyJ2rKTqOHPlkav6XPcDUnnG---RdbioMhHb1kBX7qJCr6PvzTCD/pubhtml?gid=0&single=true&widget=true&headers=false'

export default function LifePlan() {
  return (
    <section className="panel active" id="life">
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module 06</div>
          <h1 className="panel-title display">Life plan</h1>
        </div>
        <div className="panel-sub">Live embed of your life-planning sheet — edit the sheet itself, not this view.</div>
      </div>

      <div className="block" style={{ padding: 0, overflow: 'hidden' }}>
        <iframe
          src={SHEET_EMBED_URL}
          title="Life Plan sheet"
          style={{ width: '100%', height: '75vh', minHeight: '520px', border: 'none', display: 'block' }}
        />
      </div>
    </section>
  )
}
