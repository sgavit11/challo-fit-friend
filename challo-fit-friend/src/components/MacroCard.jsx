import ProgressBar from './ProgressBar'

const MACRO_META = {
  calories: { label: 'Energy on the plate 🔥', color: 'var(--saffron)', unit: 'kcal' },
  protein:  { label: 'The main course 🍗',    color: 'var(--green)',   unit: 'g' },
  carbs:    { label: 'Fuel for the dance floor 🍚', color: '#60A5FA', unit: 'g' },
  fat:      { label: 'The good stuff 🥑',     color: '#A78BFA',        unit: 'g' },
}

export default function MacroCard({ log, targets }) {
  return (
    <div className="card">
      {['calories', 'protein', 'carbs', 'fat'].map(key => {
        const meta = MACRO_META[key]
        const value = log[key] ?? 0
        const target = targets[key] ?? 0
        const remaining = Math.max(0, target - value)
        return (
          <ProgressBar
            key={key}
            value={value}
            max={target}
            color={meta.color}
            label={meta.label}
            sublabel={`${remaining}${meta.unit} left`}
          />
        )
      })}
    </div>
  )
}
