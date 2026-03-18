import { useState } from 'react'
import { scaleMacros, sumMacros } from '../../utils/macros'
import IngredientSearch from './IngredientSearch'
import IngredientLibrary from './IngredientLibrary'
import PhotoUpload from './PhotoUpload'

/**
 * Props:
 *   onSave(recipeData) — async, returns { error? }
 *   onBack            — called when user cancels
 */
export default function RecipeBuilder({ onSave, onBack }) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState(null)
  const [items, setItems] = useState([]) // [{ ingredient, quantity }]
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showIngredientLibrary, setShowIngredientLibrary] = useState(false)

  // Keep RecipeBuilder state alive — render IngredientLibrary in its place
  if (showIngredientLibrary) {
    return <IngredientLibrary onBack={() => setShowIngredientLibrary(false)} />
  }

  const totals = sumMacros(items.map(item => scaleMacros(item.ingredient, item.quantity)))

  const addItem = (ingredient) => {
    if (items.find(i => i.ingredient.id === ingredient.id)) return
    setItems(prev => [...prev, { ingredient, quantity: 1 }])
  }

  const setQty = (id, qty) => {
    const clamped = Math.max(0.5, Math.round(qty * 10) / 10)
    setItems(prev => prev.map(i => i.ingredient.id === id ? { ...i, quantity: clamped } : i))
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i.ingredient.id !== id))

  const handleSave = async () => {
    setError(null)
    if (!name.trim()) { setError('Recipe name is required.'); return }
    if (items.length === 0) { setError('Add at least one ingredient.'); return }

    setSaving(true)
    const result = await onSave({
      name: name.trim(),
      notes: notes.trim() || null,
      photo_url: photo?.url || null,
      items,
    })
    setSaving(false)
    if (result?.error) setError(result.error)
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <h1 style={{ marginBottom: 0 }}>New Recipe</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginLeft: 'auto',
            background: 'var(--primary-gradient)',
            border: 'none', color: '#0A0A0A',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, fontWeight: 600,
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <PhotoUpload value={photo} onChange={setPhoto} />

      {/* Name + Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <div className="field">
          <div className="label">Recipe Name</div>
          <input
            type="text"
            placeholder="e.g. Weekday Toast"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <div className="label">
            Notes{' '}
            <span style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'none', letterSpacing: 0 }}>
              (optional)
            </span>
          </div>
          <input
            type="text"
            placeholder="Quick notes about this recipe…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Ingredients */}
      <h2 style={{ marginBottom: 10 }}>Ingredients</h2>
      <IngredientSearch onSelect={addItem} onAddNew={() => setShowIngredientLibrary(true)} />

      {/* Added ingredient rows */}
      {items.length > 0 && (
        <div className="card" style={{ padding: '4px 16px', marginBottom: 12 }}>
          {items.map((item, idx) => {
            const scaled = scaleMacros(item.ingredient, item.quantity)
            const atMin = item.quantity <= 0.5
            return (
              <div
                key={item.ingredient.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                  borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
                    {item.ingredient.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {scaled.calories} kcal · P {scaled.protein}g · C {scaled.carbs}g · F {scaled.fat}g
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setQty(item.ingredient.id, item.quantity - 0.5)}
                    disabled={atMin}
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--bg-card-2)', border: '1px solid var(--border)',
                      color: atMin ? 'var(--text-muted)' : 'var(--text)',
                      fontSize: 15, cursor: atMin ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                  <div style={{
                    fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700,
                    minWidth: 24, textAlign: 'center', color: 'var(--text)',
                  }}>
                    {item.quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty(item.ingredient.id, item.quantity + 0.5)}
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'var(--primary-tint)', border: '1px solid rgba(45,212,191,0.3)',
                      color: 'var(--primary)', fontSize: 15, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >+</button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.ingredient.id)}
                    style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: 'rgba(248,113,113,0.1)', border: 'none',
                      color: 'var(--chili)', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: 2,
                    }}
                  >×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Live macro preview */}
      {items.length > 0 && (
        <div className="card" style={{ background: 'var(--primary-tint)', borderColor: 'rgba(45,212,191,0.2)', marginBottom: 12 }}>
          <div className="label" style={{ color: 'var(--primary)', marginBottom: 10 }}>Recipe Total</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: totals.calories, label: 'kcal', extra: { background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } },
              { val: `${totals.protein}g`, label: 'protein', extra: { color: 'var(--green)' } },
              { val: `${totals.carbs}g`, label: 'carbs', extra: { color: 'var(--blue)' } },
              { val: `${totals.fat}g`, label: 'fat', extra: { color: 'var(--purple)' } },
            ].map(({ val, label, extra }) => (
              <div key={label} style={{
                flex: 1, background: 'var(--bg-card-2)',
                borderRadius: 'var(--radius-sm)', padding: '8px 10px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700, ...extra }}>{val}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          color: 'var(--chili)', fontSize: 13,
          padding: '10px 12px', marginBottom: 12,
          background: 'rgba(248,113,113,0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(248,113,113,0.2)',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
