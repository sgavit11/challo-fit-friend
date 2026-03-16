export default function FoodLibrary({ library, onSelect, onDelete }) {
  if (library.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
        <p>Your menu is empty — scan your first item 📸</p>
      </div>
    )
  }

  return (
    <div>
      {library.map(item => (
        <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {item.perServing.calories} kcal · {item.perServing.protein}g protein · per {item.servingSize}{item.servingUnit}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onSelect(item)}
              style={{ background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
              Add
            </button>
            <button onClick={() => onDelete(item.id)}
              style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
