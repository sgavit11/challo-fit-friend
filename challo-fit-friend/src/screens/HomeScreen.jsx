import { useState } from 'react'
import { useDailyLog } from '../hooks/useDailyLog'
import { greetingIndex } from '../lib/calculations'
import MacroCard from '../components/MacroCard'
import ProgressBar from '../components/ProgressBar'

const GREETINGS = [
  (name) => `Challo ${name}, today's plate is waiting to be filled 🍽️`,
  () => `Rise and grind — the gains don't slow-cook themselves 🍲`,
  (name) => `Good morning ${name} — let's cook up a great day 🔥`,
  (name) => `New day, new menu ${name} — let's make it count 🌮`,
  () => `Your bento box of goals is empty — let's fill it 🍱`,
  (name) => `Ciao ${name} — today's session won't prep itself 🍝`,
]

export default function HomeScreen({ profile, onOpenSettings }) {
  const { log, update } = useDailyLog(profile.id)
  const [stepsInput, setStepsInput] = useState('')
  const greeting = GREETINGS[greetingIndex()](profile.name)
  const waterPct = profile.targets.waterOz > 0 ? Math.min(100, (log.waterOz / profile.targets.waterOz) * 100) : 0
  const stepsPct = profile.targets.steps > 0 ? Math.min(100, (log.steps / profile.targets.steps) * 100) : 0

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20 }}>{greeting}</h1>
        </div>
        <button onClick={onOpenSettings}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>
          ⚙️
        </button>
      </div>

      {/* Macros summary — MacroCard renders its own card wrapper */}
      <div style={{ marginBottom: 12 }}>
        <div className="label" style={{ marginBottom: 8 }}>Today's macros</div>
        <MacroCard log={log} targets={profile.targets} />
      </div>

      {/* Water */}
      <div className="card">
        <div className="label">Water 💧</div>
        <ProgressBar
          value={log.waterOz}
          max={profile.targets.waterOz}
          color="#60A5FA"
          label={`${log.waterOz} / ${profile.targets.waterOz} oz`}
          sublabel={`${Math.round(waterPct)}%`}
        />
      </div>

      {/* Steps */}
      <div className="card">
        <div className="label">Steps 👟</div>
        <ProgressBar
          value={log.steps}
          max={profile.targets.steps}
          color="var(--green)"
          label={`${log.steps.toLocaleString()} / ${profile.targets.steps.toLocaleString()}`}
          sublabel={`${Math.round(stepsPct)}%`}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            type="number"
            placeholder="Enter steps"
            value={stepsInput}
            onChange={e => setStepsInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            style={{ width: 'auto', padding: '10px 16px' }}
            onClick={() => {
              const n = Number(stepsInput)
              if (!n || n <= 0) return
              update({ steps: n })
              setStepsInput('')
            }}
          >
            Log
          </button>
        </div>
      </div>

      {/* Workout */}
      <div className="card">
        <div className="label">Workout 💪</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {log.workoutLogged
            ? `✅ ${log.workoutLabel || 'Session done'}`
            : '—  Not logged yet'}
        </div>
      </div>
    </div>
  )
}
