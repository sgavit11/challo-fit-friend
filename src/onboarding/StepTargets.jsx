import { useState } from 'react'
import { calcCalorieTarget, calcProteinTarget } from '../lib/calculations'

export default function StepTargets({ profile, onNext }) {
  const defaultCals = calcCalorieTarget({ weight: profile.currentWeight, height: profile.height })
  const defaultProtein = calcProteinTarget(profile.currentWeight)
  const [calories, setCalories] = useState(String(defaultCals))
  const [protein, setProtein] = useState(String(defaultProtein))
  const [fat, setFat] = useState('70')
  const [carbs, setCarbs] = useState('250')
  const [water, setWater] = useState('96')
  const [steps, setSteps] = useState('10000')

  const valid = [calories, protein, fat, carbs, water, steps].every(v => v && !isNaN(Number(v)))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Daily targets</h2>
      <p style={{ marginBottom: 16 }}>We've set smart defaults — adjust if needed.</p>
      {[
        { label: 'Calories (kcal) 🔥', val: calories, set: setCalories },
        { label: 'Protein (g) 🍗', val: protein, set: setProtein },
        { label: 'Fat (g) 🥑', val: fat, set: setFat },
        { label: 'Carbs (g) 🍚', val: carbs, set: setCarbs },
        { label: 'Water (oz) 💧', val: water, set: setWater },
        { label: 'Steps 👟', val: steps, set: setSteps },
      ].map(({ label, val, set }) => (
        <div key={label} style={{ marginBottom: 16 }}>
          <div className="label">{label}</div>
          <input type="number" value={val} onChange={e => set(e.target.value)} />
        </div>
      ))}
      <div style={{ height: 16 }} />
      <button className="btn btn-primary" disabled={!valid}
        onClick={() => onNext({ calories: +calories, protein: +protein, fat: +fat, carbs: +carbs, waterOz: +water, steps: +steps })}>
        Let's go 🚀
      </button>
    </div>
  )
}
