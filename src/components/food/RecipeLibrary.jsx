import { useState } from 'react'
import { useRecipes } from '../../hooks/useRecipes'
import RecipeCard from './RecipeCard'

/**
 * Props:
 *   onBuild — called when user taps "Build a new recipe"
 */
export default function RecipeLibrary({ onBuild }) {
  const { recipes, loading, deleteRecipe } = useRecipes()
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : recipes

  return (
    <>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 38 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              display: 'flex', gap: 12,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 12,
            }}>
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', background: 'var(--bg-card-2)', flexShrink: 0, animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 14, width: '55%', background: 'var(--bg-card-2)', borderRadius: 4, marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
                <div style={{ height: 10, width: '80%', background: 'var(--bg-card-2)', borderRadius: 4, marginBottom: 10, animation: 'pulse 1.4s ease-in-out 0.15s infinite' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  {[0, 1, 2, 3].map(j => (
                    <div key={j} style={{ height: 20, width: 44, borderRadius: 20, background: 'var(--bg-card-2)', animation: 'pulse 1.4s ease-in-out 0.3s infinite' }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && !search.trim() ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No recipes yet</h2>
          <p>Build your first recipe from your ingredient library.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No results</h2>
          <p>Nothing matched &ldquo;{search}&rdquo;.</p>
        </div>
      ) : (
        filtered.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onDelete={deleteRecipe}
          />
        ))
      )}

      {/* Build new card */}
      {!loading && (
        <div
          onClick={onBuild}
          style={{
            display: 'flex', gap: 12,
            border: '1px dashed rgba(45,212,191,0.25)',
            background: 'transparent',
            borderRadius: 'var(--radius)',
            padding: 12, marginBottom: 10,
            cursor: 'pointer',
          }}
        >
          <div style={{
            width: 64, height: 64,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-tint)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="2.2"
              strokeLinecap="round" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>Build a new recipe</div>
          </div>
        </div>
      )}
    </>
  )
}
