import { useState } from 'react'

const genId = () => Math.random().toString(36).slice(2)
const EMPTY = { name: '', brand: '', servingSize: '', servingUnit: 'g', calories: '', protein: '', fat: '', carbs: '' }
const SERVING_UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece']

export default function ManualEntryForm({ onSave, onCancel, onScanInstead, initialValues }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialValues })
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    const required = ['name', 'servingSize', 'calories', 'protein', 'fat', 'carbs']
    const missing = required.filter(k => !form[k])
    if (missing.length) { setError(`Please fill in: ${missing.join(', ')}`); return }
    onSave({
      id: genId(),
      name: form.name,
      brand: form.brand,
      servingSize: Number(form.servingSize),
      servingUnit: form.servingUnit,
      perServing: {
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carbs: Number(form.carbs),
      },
      dateAdded: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <div className="screen">
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 8, fontSize: 16 }}>
        ← Back
      </button>
      <h1>Add food item</h1>
      {onScanInstead && (
        <button onClick={onScanInstead} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 20, fontSize: 14, textDecoration: 'underline', padding: 0 }}>
          Scan label instead 📸
        </button>
      )}
      {[
        { key: 'name', label: 'Product name *', placeholder: 'Product name', type: 'text' },
        { key: 'brand', label: 'Brand', placeholder: 'Brand (optional)', type: 'text' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div className="label">{label}</div>
          <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 2 }}>
          <div className="label">Serving size *</div>
          <input type="number" placeholder="Serving size" value={form.servingSize} onChange={set('servingSize')} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="label">Unit</div>
          <select value={form.servingUnit} onChange={set('servingUnit')}
            style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 16 }}>
            {SERVING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      {[
        { key: 'calories', label: 'Calories (kcal) *', placeholder: 'Calories' },
        { key: 'protein', label: 'Protein (g) *', placeholder: 'Protein' },
        { key: 'fat', label: 'Fat (g) *', placeholder: 'Fat' },
        { key: 'carbs', label: 'Carbs (g) *', placeholder: 'Carbs' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div className="label">{label}</div>
          <input type="number" placeholder={placeholder} value={form[key]} onChange={set(key)} />
        </div>
      ))}
      {error && <p style={{ color: 'var(--chili)', marginBottom: 12 }}>{error}</p>}
      <button className="btn btn-primary" onClick={handleSave} style={{ marginBottom: 8 }}>
        Save to library 👨‍🍳
      </button>
    </div>
  )
}
