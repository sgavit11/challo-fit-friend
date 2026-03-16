import { useState } from 'react'
import { useDailyLog } from '../hooks/useDailyLog'
import { useFoodLibrary } from '../hooks/useFoodLibrary'
import { getDailyLog } from '../storage'
import { calcWeeklyAverage } from '../lib/calculations'
import MacroTracker from './food/MacroTracker'
import FoodLibrary from './food/FoodLibrary'
import MealBuilder from './food/MealBuilder'
import FoodScanner from './food/FoodScanner'

// Weekly average of current week's daily logs
function WeeklyMacroAverage({ profileId, targets }) {
  const today = new Date()
  const logs = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const log = getDailyLog(profileId, key)
    if (log.calories > 0) logs.push(log)
  }
  if (logs.length === 0) return null
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="label" style={{ marginBottom: 8 }}>7-day average</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {['calories','protein','fat','carbs'].map(k => (
          <div key={k} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 700 }}>{calcWeeklyAverage(logs, k)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k === 'calories' ? 'kcal' : 'g'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FoodScreen({ profile }) {
  const { log, logMeal } = useDailyLog(profile.id)
  const { library, addItem, removeItem } = useFoodLibrary()
  const [view, setView] = useState('main') // 'main' | 'scanner' | 'build'
  const [selectedItem, setSelectedItem] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleLog = (mealEntry) => {
    logMeal({ foodItemId: mealEntry.id, name: mealEntry.name, quantity: mealEntry.quantity, macros: mealEntry.macros })
    showToast('Meal locked in — macros calculated, chef approved 🤌')
    setView('main')
    setSelectedItem(null)
  }

  if (view === 'scanner') {
    return <FoodScanner onSave={(item) => {
      const isFirst = library.length === 0
      addItem(item)
      showToast(isFirst ? 'First ingredient in — your kitchen is open 👨‍🍳' : `${item.name} saved to library 📚`)
      setView('main')
    }} onCancel={() => setView('main')} />
  }

  if (view === 'build' && selectedItem) {
    return <MealBuilder item={selectedItem} onLog={handleLog} onCancel={() => setView('main')} />
  }

  return (
    <div className="screen">
      {toast && <div className="nudge">{toast}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Food 🍽️</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setView('scanner')}>
          📸 Scan
        </button>
      </div>
      <MacroTracker log={log} profile={profile} />
      <WeeklyMacroAverage profileId={profile.id} targets={profile.targets} />
      <h2 style={{ marginBottom: 12 }}>My Library</h2>
      <FoodLibrary
        library={library}
        onSelect={(item) => { setSelectedItem(item); setView('build') }}
        onDelete={removeItem}
      />
    </div>
  )
}
