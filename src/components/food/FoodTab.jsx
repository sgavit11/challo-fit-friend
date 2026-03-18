import { useState } from 'react'
import { useRecipes } from '../../hooks/useRecipes'
import RecipeLibrary from './RecipeLibrary'
import RecipeBuilder from './RecipeBuilder'
import DailyLogView from './DailyLogView'
import AnalyticsView from './AnalyticsView'

// Sub-nav tabs shown in the persistent header area
const SUB_NAV_TABS = [
  { id: 'log', label: 'Log' },
  { id: 'recipes', label: 'Recipes' },
  {
    id: 'analytics', label: 'Analytics',
    icon: (
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
]

function SubNav({ active, onSelect }) {
  return (
    <div style={{ display: 'flex', marginBottom: 18, borderBottom: '1px solid var(--border)' }}>
      {SUB_NAV_TABS.map(tab => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            style={{
              flex: 1, padding: '8px 0 10px',
              background: 'none', border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default function FoodTab() {
  const [view, setView] = useState('log') // 'log' | 'recipes' | 'builder' | 'analytics'
  const { addRecipe } = useRecipes()

  // Builder is a full-screen view — no sub-nav
  if (view === 'builder') {
    return (
      <RecipeBuilder
        onBack={() => setView('recipes')}
        onSave={async (recipeData) => {
          const result = await addRecipe(recipeData)
          if (!result.error) setView('recipes')
          return result
        }}
      />
    )
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h1>Food</h1>
        {view === 'recipes' && (
          <button
            onClick={() => setView('builder')}
            style={{
              background: 'var(--primary-gradient)',
              border: 'none', color: '#0A0A0A',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13, fontWeight: 600,
              padding: '7px 14px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            + New
          </button>
        )}
      </div>

      <SubNav active={view} onSelect={setView} />

      {view === 'log' && <DailyLogView />}

      {view === 'recipes' && (
        <RecipeLibrary onBuild={() => setView('builder')} />
      )}

      {view === 'analytics' && <AnalyticsView />}
    </div>
  )
}
