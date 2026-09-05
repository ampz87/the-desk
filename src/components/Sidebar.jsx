const ITEMS = [
  { id: 'today', num: '00', label: 'Today' },
  { id: 'quiz', num: '01', label: 'Quiz', disabled: true },
  { id: 'benchmarks', num: '02', label: 'Benchmarks', disabled: true },
  { id: 'mockic', num: '03', label: 'Mock IC', disabled: true },
  { id: 'signal', num: '04', label: 'Signal' },
  { id: 'results', num: '05', label: 'Results log' },
  { id: 'life', num: '06', label: 'Life plan' },
]

export default function Sidebar({ active, onSelect }) {
  return (
    <nav className="rail">
      <div className="rail-group-label">Portal</div>
      {ITEMS.map((item) => (
        <div
          key={item.id}
          className={`rail-item${active === item.id ? ' active' : ''}${item.disabled ? ' disabled' : ''}`}
          onClick={() => !item.disabled && onSelect(item.id)}
        >
          <span className="num">{item.num}</span> {item.label}
        </div>
      ))}
    </nav>
  )
}
