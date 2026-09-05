export default function ComingSoon({ id, moduleNum, title, blurb }) {
  return (
    <section className="panel active" id={id}>
      <div className="panel-head">
        <div>
          <div className="panel-eyebrow">Module {moduleNum}</div>
          <h1 className="panel-title display">{title}</h1>
        </div>
      </div>
      <div className="coming-soon">
        <div className="coming-soon-title display">Coming soon</div>
        <div>{blurb}</div>
      </div>
    </section>
  )
}
