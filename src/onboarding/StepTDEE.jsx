import { useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import {
  calcCalorieTarget, calcProteinTarget,
  calcFatTarget, calcCarbTarget, calcWaterTarget,
} from '../lib/calculations'

const WATER_UNITS = {
  glasses: { label: 'glasses', ozPer: 8 },
  cups: { label: 'cups', ozPer: 8 },
  oz: { label: 'oz', ozPer: 1 },
  ml: { label: 'ml', ozPer: 1 / 29.5735 },
}

const toWeightLbs = (w, unit) => unit === 'kg' ? w / 0.453592 : w
const toHeightIn = (h, unit) => unit === 'cm' ? h / 2.54 : h
const getActivityLevel = (days) => {
  if (!days || days <= 1) return 'sedentary'
  if (days <= 3) return 'light'
  if (days <= 5) return 'moderate'
  return 'active'
}

export default function StepTDEE({ profile, onNext }) {
  const weightLbs = toWeightLbs(profile.currentWeight || 160, profile.weightUnit)
  const heightIn = toHeightIn(profile.height || 70, profile.heightUnit)
  const activityLevel = profile.activityLevel || getActivityLevel(profile.trainingDaysPerWeek)

  const defaultCals = calcCalorieTarget({ weight: weightLbs, height: heightIn, dob: profile.dob, sex: profile.sex || 'm', activityLevel })
  const defaultProtein = calcProteinTarget(weightLbs)
  const defaultFat = calcFatTarget(defaultCals)
  const defaultCarbs = calcCarbTarget(defaultCals, defaultProtein, defaultFat)
  const defaultWaterOz = calcWaterTarget(weightLbs)

  const [calories, setCalories] = useState(defaultCals)
  const [protein, setProtein] = useState(defaultProtein)
  const [fat, setFat] = useState(defaultFat)
  const [carbs, setCarbs] = useState(defaultCarbs)
  const [waterOz, setWaterOz] = useState(defaultWaterOz)
  const [steps, setSteps] = useState(10000)
  const [waterUnit, setWaterUnit] = useState('oz')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')

  const waterDisplay = Math.round(waterOz / WATER_UNITS[waterUnit].ozPer)

  const TARGETS = [
    { key: 'calories', label: 'Calories 🔥', value: calories, unit: 'kcal', set: setCalories },
    { key: 'protein', label: 'Protein 🍗', value: protein, unit: 'g', set: setProtein },
    { key: 'fat', label: 'Fat 🥑', value: fat, unit: 'g', set: setFat },
    { key: 'carbs', label: 'Carbs 🍚', value: carbs, unit: 'g', set: setCarbs },
    { key: 'steps', label: 'Steps 👟', value: steps, unit: 'steps', set: setSteps },
  ]

  const openEdit = (key, currentVal) => { setEditing(key); setEditVal(String(currentVal)) }

  const confirmEdit = () => {
    const n = Number(editVal)
    if (!n || n <= 0) return
    if (editing === 'water') {
      setWaterOz(Math.round(n * WATER_UNITS[waterUnit].ozPer))
    } else {
      const t = TARGETS.find(t => t.key === editing)
      if (t) t.set(n)
    }
    setEditing(null)
  }

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Based on your stats, here's your plan 👇</h2>
      <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Tap ✏️ to adjust anything.</p>

      {TARGETS.map(({ key, label, value, unit }) => (
        <div key={key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div className="label">{label}</div>
            <div data-testid={`target-${key}`} style={{ fontSize: 22, fontWeight: 700 }}>
              {value.toLocaleString()}
              <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>
            </div>
          </div>
          <button onClick={() => openEdit(key, value)}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✏️
          </button>
        </div>
      ))}

      {/* Water card with unit toggle */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label">Water 💧</div>
            <div data-testid="target-water" style={{ fontSize: 22, fontWeight: 700 }}>
              {waterDisplay}
              <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{waterUnit}</span>
            </div>
          </div>
          <button onClick={() => openEdit('water', waterDisplay)}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✏️
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {Object.keys(WATER_UNITS).map(u => (
            <button key={u} onClick={() => setWaterUnit(u)} style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: waterUnit === u ? 'var(--saffron)' : 'var(--bg-input)',
              color: waterUnit === u ? '#000' : 'var(--text-muted)',
              fontWeight: waterUnit === u ? 700 : 400,
            }}>
              {u}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => onNext({ calories, protein, fat, carbs, waterOz, steps, waterUnit })}>
        Let's go 🚀
      </button>

      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing}`}>
        <input
          type="number" value={editVal}
          onChange={e => setEditVal(e.target.value)}
          style={{ marginBottom: 16 }} autoFocus
        />
        <button className="btn btn-primary" onClick={confirmEdit}>Save</button>
      </BottomSheet>
    </div>
  )
}
