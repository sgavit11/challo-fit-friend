import { scaleMacros, sumMacros } from '../../utils/macros'

/**
 * Props:
 *   recipe     — recipe object with recipe_ingredients[]{ingredient, quantity}
 *   onPress    — called with recipe when tapped
 *   onDelete   — called with recipe.id when delete tapped
 */
export default function RecipeCard({ recipe, onPress, onDelete }) {
  const totals = sumMacros(
    (recipe.recipe_ingredients ?? []).map(ri => scaleMacros(ri.ingredient, ri.quantity))
  )
  const ingredientNames = (recipe.recipe_ingredients ?? [])
    .map(ri => ri.ingredient.name)
    .join(', ')

  return (
    <div
      onClick={() => onPress?.(recipe)}
      style={{
        display: 'flex', gap: 12,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: 12, marginBottom: 10,
        cursor: onPress ? 'pointer' : 'default',
        position: 'relative',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 64, height: 64,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-card-2)',
        flexShrink: 0, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {recipe.photo_url ? (
          <img src={recipe.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <svg width="24" height="24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <line x1="7" y1="2" x2="7" y2="22"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
          </svg>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 4,
          color: 'var(--text)',
        }}>
          {recipe.name}
        </div>
        {ingredientNames && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {ingredientNames}
          </p>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          <span className="tag tag-cal">{totals.calories} kcal</span>
          <span className="tag tag-pro">{totals.protein}g P</span>
          <span className="tag tag-carb">{totals.carbs}g C</span>
          <span className="tag tag-fat">{totals.fat}g F</span>
        </div>
      </div>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(recipe.id) }}
          style={{
            position: 'absolute', top: 8, right: 8,
            width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(248,113,113,0.1)', border: 'none',
            color: 'var(--chili)', fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
      )}
    </div>
  )
}
