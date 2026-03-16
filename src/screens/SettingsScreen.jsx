import { useState, useEffect, useRef } from 'react'
import { exportAllData, importAllData, getActiveProfileId } from '../storage'

const getStorageUsedMB = () => {
  let total = 0
  for (const key in localStorage) {
    if (Object.hasOwn(localStorage, key)) total += localStorage[key].length * 2
  }
  return (total / (1024 * 1024)).toFixed(2)
}

export default function SettingsScreen({ profile, onUpdate, onBack }) {
  const [targets, setTargets] = useState({ ...profile.targets })
  const [guardrails, setGuardrails] = useState({ ...profile.calorieGuardrails })
  const [weightUnit, setWeightUnit] = useState(profile.weightUnit || 'lbs')
  const [waterUnit, setWaterUnit] = useState(profile.waterUnit || 'oz')
  const [waterReminders, setWaterReminders] = useState(profile.waterReminders ?? true)
  const [workoutLabels, setWorkoutLabels] = useState((profile.workoutLabels || []).join(', '))
  const [name, setName] = useState(profile.name)
  const [currentWeight, setCurrentWeight] = useState(String(profile.currentWeight))
  const [goalWeight, setGoalWeight] = useState(String(profile.goalWeight))
  const [targetDate, setTargetDate] = useState(profile.targetDate || '')
  const [saved, setSaved] = useState(false)
  const [storageMB, setStorageMB] = useState('0')
  const [toast, setToast] = useState(null)
  const fileInputRef = useRef()

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  useEffect(() => { setStorageMB(getStorageUsedMB()) }, [])

  const save = () => {
    onUpdate({
      ...profile,
      name,
      currentWeight: Number(currentWeight),
      goalWeight: Number(goalWeight),
      targetDate,
      weightUnit,
      waterUnit,
      waterReminders,
      workoutLabels: workoutLabels.split(',').map(l => l.trim()).filter(Boolean),
      targets,
      calorieGuardrails: guardrails,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleExport = () => {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'challo-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      let backup
      try {
        backup = JSON.parse(ev.target.result)
      } catch {
        showToast('Invalid backup file')
        return
      }
      if (!backup.version) {
        showToast('Invalid backup file')
        return
      }
      const currentProfileId = getActiveProfileId()
      const { foods, days, weights } = importAllData(backup, currentProfileId)
      if (foods === 0 && days === 0 && weights === 0) {
        showToast('Nothing new to import — all data already up to date')
      } else {
        showToast(`Imported ${foods} foods, ${days} log days, ${weights} weight entries`)
      }
    }
    reader.readAsText(file)
  }

  const numInput = (label, value, onChange) => (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} />
    </div>
  )

  const unitToggle = (label, value, onChange, optA, optB) => (
    <div style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[optA, optB].map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
              background: value === opt ? 'var(--saffron)' : 'var(--bg-input)',
              color: value === opt ? '#000' : 'var(--text)' }}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="screen">
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 16, fontSize: 16 }}>
        ← Back
      </button>
      <h1>The Recipe ⚙️</h1>

      {toast && <div className="nudge">{toast}</div>}

      {/* Profile */}
      <div className="card">
        <h2>My Kitchen 👤</h2>
        <div style={{ marginBottom: 12 }}>
          <div className="label">Name</div>
          <input type="text" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div className="label">Current weight ({weightUnit})</div>
          <input type="number" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div className="label">Goal weight ({weightUnit})</div>
          <input type="number" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
        </div>
        <div>
          <div className="label">Target date</div>
          <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </div>
      </div>

      {/* Units */}
      <div className="card">
        <h2>Units</h2>
        {unitToggle('Weight', weightUnit, setWeightUnit, 'lbs', 'kg')}
        {unitToggle('Water', waterUnit, setWaterUnit, 'oz', 'ml')}
      </div>

      {/* Daily targets */}
      <div className="card">
        <h2>Daily targets</h2>
        {numInput('Calories 🔥 (kcal)', targets.calories, v => setTargets(t => ({ ...t, calories: v })))}
        {numInput('Protein 🍗 (g)', targets.protein, v => setTargets(t => ({ ...t, protein: v })))}
        {numInput('Fat 🥑 (g)', targets.fat, v => setTargets(t => ({ ...t, fat: v })))}
        {numInput('Carbs 🍚 (g)', targets.carbs, v => setTargets(t => ({ ...t, carbs: v })))}
        {numInput('Water 💧 (oz)', targets.waterOz, v => setTargets(t => ({ ...t, waterOz: v })))}
        {numInput('Steps 👟', targets.steps, v => setTargets(t => ({ ...t, steps: v })))}
      </div>

      {/* Calorie guardrails */}
      <div className="card">
        <h2>Calorie guardrails</h2>
        {numInput('Under-eating alert (% of target)', guardrails.underPercent, v => setGuardrails(g => ({ ...g, underPercent: v })))}
        {numInput('Over-eating alert (% of target)', guardrails.overPercent, v => setGuardrails(g => ({ ...g, overPercent: v })))}
      </div>

      {/* Training */}
      <div className="card">
        <h2>Workout labels</h2>
        <div className="label">Session names (comma-separated)</div>
        <input type="text" value={workoutLabels} onChange={e => setWorkoutLabels(e.target.value)} />
      </div>

      {/* Notifications */}
      <div className="card">
        <h2>Notifications</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Water reminders (every 2 hours)</div>
          <button onClick={() => setWaterReminders(r => !r)}
            style={{ background: waterReminders ? 'var(--green)' : 'var(--bg-input)', border: 'none', borderRadius: 20, padding: '6px 16px', cursor: 'pointer', color: waterReminders ? '#000' : 'var(--text-muted)', fontWeight: 600 }}>
            {waterReminders ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* Scanner */}
      <div className="card">
        <h2>Food scanner</h2>
        <p style={{ marginBottom: 8 }}>API key is set in your Netlify dashboard — never stored in the app.</p>
        <div style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: 14 }}>
          Scanner: <span style={{ color: 'var(--green)' }}>✅ Ready (when deployed to Netlify)</span>
        </div>
      </div>

      {/* Data */}
      <div className="card">
        <h2>Data</h2>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button className="btn btn-primary" onClick={handleExport} style={{ marginBottom: 8 }}>
          Export my data
        </button>
        <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Import from backup
        </button>
      </div>

      {/* Storage warning */}
      {Number(storageMB) > 4 && (
        <div className="nudge" style={{ borderColor: 'var(--chili)' }}>
          ⚠️ Storage almost full ({storageMB} MB / ~5 MB) — consider clearing old logs
        </div>
      )}

      <button className="btn btn-primary" onClick={save} style={{ marginBottom: 32 }}>
        {saved ? '✅ Saved!' : 'Save changes'}
      </button>
    </div>
  )
}
