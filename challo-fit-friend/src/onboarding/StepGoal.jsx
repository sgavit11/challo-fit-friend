import { useState } from 'react'
import ScrollPicker from '../components/ScrollPicker'

const LBS_OPTIONS = Array.from({ length: 321 }, (_, i) => String(80 + i))
const KG_OPTIONS = Array.from({ length: 166 }, (_, i) => String(35 + i))

export default function StepGoal({ weightUnit = 'lbs', onNext }) {
  const isMetric = weightUnit === 'kg'
  const [goalWeight, setGoalWeight] = useState(isMetric ? '68' : '150')
  const [targetDate, setTargetDate] = useState('')
  const valid = !!targetDate

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your goal</h2>
      <div className="label" style={{ marginBottom: 8 }}>Goal weight ({weightUnit})</div>
      <ScrollPicker
        options={isMetric ? KG_OPTIONS : LBS_OPTIONS}
        value={goalWeight}
        onChange={setGoalWeight}
      />
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 24 }}>
        {goalWeight} {weightUnit}
      </div>
      <div style={{ marginBottom: 32 }}>
        <div className="label">Target date</div>
        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={!valid}
        onClick={() => onNext({ goalWeight: Number(goalWeight), targetDate })}>
        Next →
      </button>
    </div>
  )
}
