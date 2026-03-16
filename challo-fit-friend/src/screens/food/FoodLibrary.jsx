import SwipeableCard from '../../components/SwipeableCard'

export default function FoodLibrary({ library, onSelect, onDelete }) {
  if (library.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
        <p>Your menu is empty — tap + Add to get started.</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>← Swipe left to delete</p>
      {library.map(item => (
        <SwipeableCard key={item.id} onDelete={() => onDelete(item.id)}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, marginBottom: 0 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {item.perServing.calories} kcal · {item.perServing.protein}g protein · per {item.servingSize}{item.servingUnit}
              </div>
            </div>
            <button onClick={() => onSelect(item)}
              style={{ background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
              Add
            </button>
          </div>
        </SwipeableCard>
      ))}
    </div>
  )
}
