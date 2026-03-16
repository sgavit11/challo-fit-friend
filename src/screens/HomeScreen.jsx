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
        <button onClick={onOpenSettings} aria-label="Settings"
          style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, width: 38, height: 38,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
          }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {/* Macros summary — MacroCard renders its own card wrapper */}
      <div style={{ marginBottom: 12 }}>
        <div className="label" style={{ marginBottom: 8 }}>Today's macros</div>
        <MacroCard log={log} targets={profile.targets} />
      </div>

      {/* Water */}
      <div className="card">
        <div className="label">Water</div>
        <ProgressBar
          value={log.waterOz}
          max={profile.targets.waterOz}
          color="linear-gradient(90deg, #2DD4BF, #38BDF8)"
          label={`${log.waterOz} / ${profile.targets.waterOz} oz`}
          sublabel={`${Math.round(waterPct)}%`}
        />
      </div>

      {/* Steps */}
      <div className="card">
        <div className="label">Steps</div>
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
        <div className="label">Workout</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {log.workoutLogged
            ? `✅ ${log.workoutLabel || 'Session done'}`
            : '—  Not logged yet'}
        </div>
      </div>
    </div>
  )
}
