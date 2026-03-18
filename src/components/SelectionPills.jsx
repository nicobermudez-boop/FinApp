// SelectionPills — "selected pill / list of options" pattern
// Props:
//   items:      [{ id, label }]
//   selected:   id | null
//   onSelect:   (id) => void
//   onClear:    () => void        — only used when alwaysShow=false
//   alwaysShow: bool (default false) — show all items always, highlight selected
export default function SelectionPills({ items, selected, onSelect, onClear, alwaysShow = false }) {
  if (alwaysShow) {
    return (
      <div className="pills">
        {items.map(item => (
          <button key={item.id} className={`p ${selected === item.id ? 's' : ''}`}
            onClick={() => onSelect(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
    )
  }

  const selectedItem = items.find(i => i.id === selected)

  return (
    <div className="pills">
      {selected ? (
        <button className="p s" style={{ position: 'relative', paddingRight: 24 }} onClick={onClear}>
          {selectedItem?.label}
          <span style={{ position: 'absolute', right: 8, fontSize: 11, color: 'var(--text-dim)' }}>✕</span>
        </button>
      ) : items.map(item => (
        <button key={item.id} className="p" onClick={() => onSelect(item.id)}>
          {item.label}
        </button>
      ))}
    </div>
  )
}
