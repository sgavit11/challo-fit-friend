import { useState } from 'react'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DEFAULT_LABELS = ['Push','Pull','Legs','Cardio']

export default function StepTraining({ onNext }) {
  const [selectedDays, setSelectedDays] = useState([])
  const [labels, setLabels] = useState(DEFAULT_LABELS.join(', '))

  const toggleDay = (day) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Training days</h2>
      <p style={{ marginBottom: 16 }}>Which days do you train?</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {DAYS.map(day => (
          <button key={day} onClick={() => toggleDay(day)}
            className={selectedDays.includes(day) ? 'chip chip-active' : 'chip'}
            style={{ padding: '8px 14px', borderRadius: 20, fontSize: 14 }}>
            {day.slice(0,3)}
          </button>
        ))}
      </div>
      <div className="label">Workout labels (comma-separated)</div>
      <input type="text" value={labels} onChange={e => setLabels(e.target.value)} style={{ marginBottom: 32 }} />
      <button className="btn btn-primary" disabled={selectedDays.length === 0}
        onClick={() => onNext({
          trainingDays: selectedDays,
          trainingDaysPerWeek: selectedDays.length,
          workoutLabels: labels.split(',').map(l => l.trim()).filter(Boolean),
        })}>
        Next →
      </button>
    </div>
  )
}
