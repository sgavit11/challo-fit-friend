import { useState } from 'react'
import { useIngredients } from '../../hooks/useIngredients'

/**
 * Search-as-you-type ingredient picker.
 * Used inside RecipeBuilder to find and add ingredients from the library.
 *
 * Props:
 *   onSelect(ingredient)  — called when user picks a result
 *   onAddNew()            — called when user taps "Add a new ingredient →"
 */
export default function IngredientSearch({ onSelect, onAddNew }) {
  const [query, setQuery] = useState('')
  const { searchIngredients, loading } = useIngredients()

  const results = query.trim() ? searchIngredients(query) : []
  const showNudge = query.trim().length > 0 && results.length === 0 && !loading

  return (
    <div>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: results.length > 0 ? 0 : 10 }}>
        <svg
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your ingredient library…"
          style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Dropdown results */}
      {results.length > 0 && (
        <div style={{
          background: 'var(--bg-card-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 12,
          overflow: 'hidden',
        }}>
          {results.map((ing, idx) => (
            <div
              key={ing.id}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '10px 14px', gap: 10,
                borderBottom: idx < results.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{ing.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {ing.calories} kcal · P {ing.protein}g · C {ing.carbs}g · F {ing.fat}g per {ing.serving_unit}
                </div>
              </div>
              <button
                onClick={() => { onSelect?.(ing); setQuery('') }}
                style={{
                  background: 'var(--primary-tint)',
                  border: '1px solid rgba(45,212,191,0.3)',
                  color: 'var(--primary)',
                  width: 28, height: 28,
                  borderRadius: '50%',
                  fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                +
              </button>
            </div>
          ))}
        </div>
      )}

      {/* "Can't find it?" nudge */}
      {(showNudge || query.trim().length === 0) && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, padding: '0 2px' }}>
          {showNudge ? (
            <>
              No results for "{query}".{' '}
              <span
                onClick={onAddNew}
                style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Add a new ingredient →
              </span>
            </>
          ) : (
            <>
              Can&apos;t find it?{' '}
              <span
                onClick={onAddNew}
                style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Add a new ingredient →
              </span>
            </>
          )}
        </div>
      )}
    </div>
  )
}
