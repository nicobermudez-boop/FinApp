// CategoryGrid — expense category selector grid
// Shows the selected category (with ✕ to deselect) or the full grid to pick from.
export default function CategoryGrid({ categories, selectedId, selectedCat, onSelect, onClear }) {
  return (
    <div className="cg">
      {selectedId ? (
        <button className="cc s" onClick={() => onSelect(selectedId)} style={{ position: 'relative' }}>
          <div className="ci">{selectedCat?.icon || '📦'}</div>
          <div className="cn">{selectedCat?.name}</div>
          <span
            onClick={e => { e.stopPropagation(); onClear() }}
            style={{ position: 'absolute', top: 4, right: 6, fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer', lineHeight: 1 }}>
            ✕
          </span>
        </button>
      ) : categories.map(c => (
        <button key={c.id} className="cc" onClick={() => onSelect(c.id)}>
          <div className="ci">{c.icon || '📦'}</div>
          <div className="cn">{c.name}</div>
        </button>
      ))}
    </div>
  )
}
