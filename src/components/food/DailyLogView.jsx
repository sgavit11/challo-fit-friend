import { useState, useMemo } from 'react'
import MacroRings from './MacroRings'
import { useFoodLog } from '../../hooks/useFoodLog'
import { useRecipes } from '../../hooks/useRecipes'
import { useProfile } from '../../hooks/useProfile'
import { sumMacros, scaleMacros } from '../../utils/macros'

// Build last-7-days array: [{ dateStr, dayLabel, num }], today last
function buildDateStrip() {
  const days = []
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      dateStr: d.toISOString().split('T')[0],
      dayLabel: i === 0 ? 'Today' : DAY_NAMES[d.getDay()],
      num: d.getDate(),
    })
  }
  return days
}

function calcRecipeMacros(recipe) {
  return sumMacros(
    (recipe.recipe_ingredients ?? []).map(ri =>
      scaleMacros(ri.ingredient, ri.quantity)
    )
  )
}

export default function DailyLogView() {
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [showPicker, setShowPicker] = useState(false)
  const [adding, setAdding] = useState(null) // recipe id being added

  const dateStrip = buildDateStrip()
  const { entries, totals, loading, error, addEntry, removeEntry } = useFoodLog(selectedDate)
  const { recipes, loading: recipesLoading } = useRecipes()
  const { activeProfile } = useProfile()

  // Derive macro targets from profile
  const targets = useMemo(() => {
    if (!activeProfile?.targets) return { calories: 2000, protein: 150, carbs: 200, fat: 65 }
    const { calories, protein, carbs, fat } = activeProfile.targets
    return { calories, protein, carbs, fat }
  }, [activeProfile])

  async function handleAddMeal(recipe) {
    setAdding(recipe.id)
    await addEntry(recipe)
    setAdding(null)
    setShowPicker(false)
  }

  return (
    <div>
      {/* Date strip */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto',
        paddingBottom: 4, marginBottom: 16,
        scrollbarWidth: 'none',
      }}>
        {dateStrip.map(({ dateStr, dayLabel, num }) => {
          const isActive = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                background: isActive ? 'var(--primary-tint)' : 'var(--bg-card)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer', flexShrink: 0, minWidth: 44,
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {dayLabel}
              </span>
              <span style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 16, fontWeight: 700,
                color: isActive ? 'var(--primary)' : 'var(--text)',
              }}>
                {num}
              </span>
            </button>
          )
        })}
      </div>

      {/* Macro rings */}
      <MacroRings totals={totals} targets={targets} />

      {/* Meal entries */}
      <h2 style={{ marginBottom: 6, marginTop: 4 }}>
        {selectedDate === todayStr ? "Today's Meals" : 'Meals'}
      </h2>

      {loading ? (
        // Skeleton rows
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '4px 16px',
          marginBottom: 12,
        }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-2)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 12, width: '60%', background: 'var(--bg-card-2)', borderRadius: 4, marginBottom: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
                <div style={{ height: 10, width: '40%', background: 'var(--bg-card-2)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out 0.2s infinite' }} />
              </div>
              <div style={{ height: 16, width: 32, background: 'var(--bg-card-2)', borderRadius: 4, animation: 'pulse 1.4s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{
          color: 'var(--chili)', fontSize: 13,
          padding: '12px 14px', marginBottom: 12,
          background: 'rgba(248,113,113,0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(248,113,113,0.2)',
        }}>
          {error}
        </div>
      ) : entries.length > 0 ? (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '4px 16px',
          marginBottom: 12, boxShadow: 'var(--shadow-sm)',
        }}>
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0',
                borderBottom: idx < entries.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-card-2)', flexShrink: 0,
                overflow: 'hidden', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {entry.photo_url
                  ? <img src={entry.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <svg width="18" height="18" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
                }
              </div>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  P {Math.round(entry.protein)}g · C {Math.round(entry.carbs)}g · F {Math.round(entry.fat)}g
                </div>
              </div>
              {/* Calories */}
              <div style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700,
                color: 'var(--primary)', flexShrink: 0,
              }}>
                {Math.round(entry.calories)}
              </div>
              {/* Delete */}
              <button
                onClick={() => removeEntry(entry.id)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(248,113,113,0.1)', border: 'none',
                  color: 'var(--chili)', fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '32px 16px', gap: 8, textAlign: 'center', marginBottom: 8,
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
          </svg>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
            No meals logged yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Tap "Add Meal" to log your first entry.
          </div>
        </div>
      )}

      {/* Add Meal button */}
      <button
        onClick={() => setShowPicker(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%', padding: 14,
          background: 'var(--primary-tint)',
          border: '1px dashed rgba(45,212,191,0.3)',
          borderRadius: 'var(--radius)',
          color: 'var(--primary)', fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, fontWeight: 600, cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {showPicker ? 'Cancel' : 'Add Meal'}
      </button>

      {/* Recipe picker (inline) */}
      {showPicker && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: 12,
          marginBottom: 12, boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            marginBottom: 10,
          }}>
            Pick a recipe
          </div>
          {recipesLoading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading recipes…</div>
          ) : recipes.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              No recipes yet — build one in the Recipes tab.
            </div>
          ) : (
            recipes.map((recipe, idx) => {
              const m = calcRecipeMacros(recipe)
              const isAdding = adding === recipe.id
              return (
                <button
                  key={recipe.id}
                  onClick={() => handleAddMeal(recipe)}
                  disabled={isAdding}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '10px 0',
                    background: 'none', border: 'none',
                    borderBottom: idx < recipes.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: isAdding ? 'default' : 'pointer',
                    opacity: isAdding ? 0.6 : 1,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-2)', flexShrink: 0,
                    overflow: 'hidden', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {recipe.photo_url
                      ? <img src={recipe.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <svg width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
                    }
                  </div>
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {recipe.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {Math.round(m.calories)} kcal · P {Math.round(m.protein)}g · C {Math.round(m.carbs)}g · F {Math.round(m.fat)}g
                    </div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--primary-tint)',
                    border: '1px solid rgba(45,212,191,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: 'var(--primary)', fontSize: 18,
                  }}>
                    {isAdding ? '…' : '+'}
                  </div>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
