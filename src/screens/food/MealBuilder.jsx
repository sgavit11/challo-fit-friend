import { useState } from 'react'
import { calcMacrosForQuantity } from '../../lib/calculations'

export default function MealBuilder({ item, onLog, onCancel }) {
  const [quantity, setQuantity] = useState('1')
  const qty = Number(quantity)
  const valid = !isNaN(qty) && qty > 0
  const macros = valid ? calcMacrosForQuantity(item, qty) : null

  return (
    <div className="card">
      <h2>{item.name}</h2>
      <p style={{ marginBottom: 16 }}>Per serving: {item.servingSize}{item.servingUnit}</p>
      <div className="label">Quantity (servings)</div>
      <input type="number" value={quantity} step="0.5" min="0.5"
        onChange={e => setQuantity(e.target.value)} style={{ marginBottom: 16 }} />
      {macros && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {['calories','protein','fat','carbs'].map(k => (
            <div key={k} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(macros[k])}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k === 'calories' ? 'kcal' : 'g'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-primary" disabled={!valid} onClick={() => onLog({ ...item, quantity: qty, macros })} style={{ marginBottom: 8 }}>
        Log to today 🤌
      </button>
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
    </div>
  )
}
