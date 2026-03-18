import { useState } from 'react'
import { useIngredients } from '../../hooks/useIngredients'

const EMPTY_FORM = {
  name: '',
  serving_size: '1',
  serving_unit: '',
  calories: '0',
  protein: '0',
  carbs: '0',
  fat: '0',
}

const MACRO_CONFIG = [
  { key: 'calories', label: 'Calories', unit: 'kcal', color: null,               dotStyle: { background: 'linear-gradient(135deg, #2DD4BF, #38BDF8)' } },
  { key: 'protein',  label: 'Protein',  unit: 'g',    color: 'var(--green)',      dotStyle: { background: 'var(--green)' } },
  { key: 'carbs',    label: 'Carbs',    unit: 'g',    color: 'var(--blue)',       dotStyle: { background: 'var(--blue)' } },
  { key: 'fat',      label: 'Fat',      unit: 'g',    color: 'var(--purple)',     dotStyle: { background: 'var(--purple)' } },
]

const STEPPER_PLUS_STYLE = {
  calories: { background: 'var(--primary-tint)',         border: '1px solid rgba(45,212,191,0.3)',  color: 'var(--primary)' },
  protein:  { background: 'rgba(110,231,183,0.10)',      border: '1px solid rgba(110,231,183,0.3)', color: 'var(--green)' },
  carbs:    { background: 'rgba(125,211,252,0.10)',      border: '1px solid rgba(125,211,252,0.3)', color: 'var(--blue)' },
  fat:      { background: 'rgba(192,132,252,0.10)',      border: '1px solid rgba(192,132,252,0.3)', color: 'var(--purple)' },
}

function MacroStepper({ macroKey, label, unit, color, dotStyle, value, onChange }) {
  const numVal = parseFloat(value) || 0
  const step = macroKey === 'calories' ? 5 : 0.5

  const increment = () => onChange(String(Math.round((numVal + step) * 10) / 10))
  const decrement = () => onChange(String(Math.max(0, Math.round((numVal - step) * 10) / 10)))

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: 80 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, ...dotStyle }} />
        <div className="label" style={{ marginBottom: 0 }}>{label}</div>
      </div>

      {/* Stepper */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <button
          type="button"
          onClick={decrement}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--bg-card-2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >−</button>

        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={e => {
            const n = parseFloat(e.target.value)
            onChange(isNaN(n) || n < 0 ? '0' : String(Math.round(n * 10) / 10))
          }}
          style={{
            width: 64, textAlign: 'center',
            fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700,
            color: color || 'var(--text)',
            background: 'none', border: 'none',
            borderBottom: '1.5px solid var(--border)',
            borderRadius: 0, padding: '2px 0', boxShadow: 'none',
          }}
        />

        <button
          type="button"
          onClick={increment}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            ...STEPPER_PLUS_STYLE[macroKey],
          }}
        >+</button>

        <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 24 }}>{unit}</div>
      </div>
    </div>
  )
}

export default function IngredientLibrary({ onBack }) {
  const { ingredients, loading, addIngredient, deleteIngredient, updateIngredient } = useIngredients()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  const filtered = search.trim()
    ? ingredients.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : ingredients

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) { setFormError('Name is required.'); return }
    if (!form.serving_unit.trim()) { setFormError('Serving unit is required.'); return }

    setSaving(true)
    const { error } = await addIngredient({
      name:         form.name.trim(),
      serving_size: parseFloat(form.serving_size) || 1,
      serving_unit: form.serving_unit.trim(),
      calories:     parseFloat(form.calories) || 0,
      protein:      parseFloat(form.protein)  || 0,
      carbs:        parseFloat(form.carbs)    || 0,
      fat:          parseFloat(form.fat)      || 0,
    })
    setSaving(false)

    if (error) {
      setFormError(error)
    } else {
      setForm(EMPTY_FORM)
      setShowForm(false)
    }
  }

  const previewCal = parseFloat(form.calories) || 0
  const previewPro = parseFloat(form.protein)  || 0
  const previewCarb = parseFloat(form.carbs)   || 0
  const previewFat = parseFloat(form.fat)      || 0
  const servingLabel = `${form.serving_size || 1} ${form.serving_unit || 'serving'}`

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        {onBack && (
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <h1 style={{ marginBottom: 0 }}>Ingredients</h1>
        {!showForm && (
          <button
            onClick={() => { setForm(EMPTY_FORM); setFormError(null); setShowForm(true) }}
            style={{
              marginLeft: 'auto',
              background: 'var(--primary-tint)',
              border: '1px solid rgba(45,212,191,0.3)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            + Add
          </button>
        )}
      </div>

      {/* Add Ingredient Form */}
      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setShowForm(false); setFormError(null) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <h2 style={{ marginBottom: 0 }}>Add Ingredient</h2>
          </div>

          {/* Name */}
          <div className="field" style={{ marginBottom: 14 }}>
            <div className="label">Ingredient Name</div>
            <input
              type="text"
              placeholder="e.g. Large Egg"
              value={form.name}
              onChange={e => setField('name', e.target.value)}
            />
          </div>

          {/* Serving size + unit */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div className="field" style={{ flex: 1 }}>
              <div className="label">Serving Size</div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="1"
                value={form.serving_size}
                onChange={e => setField('serving_size', e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <div className="label">Unit</div>
              <input
                type="text"
                placeholder="e.g. egg, slice, g, cup"
                value={form.serving_unit}
                onChange={e => setField('serving_unit', e.target.value)}
              />
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <div className="label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Macros per serving</div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Macro steppers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {MACRO_CONFIG.map(({ key, label, unit, color, dotStyle }) => (
              <MacroStepper
                key={key}
                macroKey={key}
                label={label}
                unit={unit}
                color={color}
                dotStyle={dotStyle}
                value={form[key]}
                onChange={val => setField(key, val)}
              />
            ))}
          </div>

          {/* Live preview */}
          <div style={{
            background: 'var(--primary-tint)',
            border: '1px solid rgba(45,212,191,0.2)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div className="label" style={{ color: 'var(--primary)', marginBottom: 2 }}>
                {servingLabel} =
              </div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                {previewCal} kcal
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {[['P', previewPro, 'var(--green)'], ['C', previewCarb, 'var(--blue)'], ['F', previewFat, 'var(--purple)']].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}g</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <div style={{
              color: 'var(--chili)', fontSize: 13,
              padding: '10px 12px', marginBottom: 12,
              background: 'rgba(248,113,113,0.08)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}>
              {formError}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save Ingredient'}
          </button>
        </form>
      )}

      {/* Search */}
      {!showForm && (
        <>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <svg
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
              width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search ingredients…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>

          {/* Ingredient list */}
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 32 }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🥦</div>
              <h2>{search ? 'No results' : 'No ingredients yet'}</h2>
              <p>{search ? `Nothing matched "${search}".` : 'Tap + Add to create your first ingredient.'}</p>
            </div>
          ) : (
            <div className="card" style={{ padding: '4px 16px' }}>
              {filtered.map((ing, idx) => (
                <div
                  key={ing.id}
                  style={{
                    padding: '12px 0',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {editingId === ing.id ? (
                    /* ── Inline edit form ── */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <div className="label">Name</div>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                          <div className="label">Serving</div>
                          <input
                            type="number"
                            value={editForm.serving_size}
                            onChange={e => setEditForm(f => ({ ...f, serving_size: e.target.value }))}
                          />
                        </div>
                        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                          <div className="label">Calories</div>
                          <input
                            type="number"
                            value={editForm.calories}
                            onChange={e => setEditForm(f => ({ ...f, calories: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                          <div className="label">Protein (g)</div>
                          <input
                            type="number"
                            value={editForm.protein}
                            onChange={e => setEditForm(f => ({ ...f, protein: e.target.value }))}
                          />
                        </div>
                        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                          <div className="label">Carbs (g)</div>
                          <input
                            type="number"
                            value={editForm.carbs}
                            onChange={e => setEditForm(f => ({ ...f, carbs: e.target.value }))}
                          />
                        </div>
                        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                          <div className="label">Fat (g)</div>
                          <input
                            type="number"
                            value={editForm.fat}
                            onChange={e => setEditForm(f => ({ ...f, fat: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          onClick={async () => {
                            const result = await updateIngredient(editingId, {
                              name:         editForm.name,
                              serving_size: parseFloat(editForm.serving_size) || 1,
                              calories:     parseFloat(editForm.calories)     || 0,
                              protein:      parseFloat(editForm.protein)      || 0,
                              carbs:        parseFloat(editForm.carbs)        || 0,
                              fat:          parseFloat(editForm.fat)          || 0,
                            })
                            if (result?.error) {
                              alert('Failed to save: ' + (result.error.message || result.error))
                              return
                            }
                            setEditingId(null)
                          }}
                          style={{
                            flex: 1,
                            background: 'var(--primary-tint)',
                            border: '1px solid rgba(45,212,191,0.3)',
                            color: 'var(--primary)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 0',
                            fontSize: 13, fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            flex: 1,
                            background: 'var(--bg-card-2)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 0',
                            fontSize: 13, fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal row ── */
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                          {ing.name}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="tag tag-cal">{ing.calories} kcal</span>
                          <span className="tag tag-pro">P {ing.protein}g</span>
                          <span className="tag tag-carb">C {ing.carbs}g</span>
                          <span className="tag tag-fat">F {ing.fat}g</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          per {ing.serving_size} {ing.serving_unit}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(ing.id)
                          setEditForm({
                            name:         ing.name,
                            serving_size: ing.serving_size,
                            calories:     ing.calories,
                            protein:      ing.protein,
                            carbs:        ing.carbs,
                            fat:          ing.fat,
                          })
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteIngredient(ing.id)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(248,113,113,0.1)', border: 'none',
                          color: 'var(--chili)', fontSize: 14,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
