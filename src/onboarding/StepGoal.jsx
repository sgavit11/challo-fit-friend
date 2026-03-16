import { useState } from 'react'

export default function StepGoal({ weightUnit, onNext }) {
  const [goalWeight, setGoalWeight] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const valid = goalWeight && targetDate && !isNaN(Number(goalWeight))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your goal</h2>
      <div style={{ marginBottom: 16 }}>
        <div className="label">Goal weight ({weightUnit})</div>
        <input type="number" placeholder="165" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
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
