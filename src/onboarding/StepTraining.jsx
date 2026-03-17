import { useState } from 'react'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const PRESET_SPLITS = ['Push', 'Pull', 'Legs', 'Cardio', 'Yoga', 'Upper Body', 'Lower Body']

export default function StepTraining({ onNext }) {
  const [selectedDays, setSelectedDays] = useState([])
  const [selectedPresets, setSelectedPresets] = useState([])
  const [showCustom, setShowCustom] = useState(false)
  const [customText, setCustomText] = useState('')

  const toggleDay = (day) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

  const togglePreset = (preset) =>
    setSelectedPresets(prev => prev.includes(preset) ? prev.filter(p => p !== preset) : [...prev, preset])

  const getLabels = () => {
    const custom = showCustom ? customText.split(',').map(l => l.trim()).filter(Boolean) : []
    return [...selectedPresets, ...custom]
  }

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

      <div className="label">Workout Split</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {PRESET_SPLITS.map(preset => (
          <button key={preset} onClick={() => togglePreset(preset)}
            className={selectedPresets.includes(preset) ? 'chip chip-active' : 'chip'}
            style={{ padding: '8px 14px', borderRadius: 20, fontSize: 14 }}>
            {preset}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(prev => !prev)}
          className={showCustom ? 'chip chip-active' : 'chip'}
          style={{ padding: '8px 14px', borderRadius: 20, fontSize: 14 }}>
          Custom…
        </button>
      </div>

      {showCustom && (
        <input
          type="text"
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          placeholder="e.g. Chest, Back, Shoulders"
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ marginBottom: 32 }} />

      <button className="btn btn-primary" disabled={selectedDays.length === 0}
        onClick={() => onNext({
          trainingDays: selectedDays,
          trainingDaysPerWeek: selectedDays.length,
          workoutLabels: getLabels(),
        })}>
        Next →
      </button>
    </div>
  )
}
