import { useDailyLog } from '../hooks/useDailyLog'
import { getWorkoutNudge } from '../lib/nudges'

export default function WorkoutScreen({ profile }) {
  const { log, update } = useDailyLog(profile.id)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const isTrainingDay = profile.trainingDays?.includes(today)
  const nudge = getWorkoutNudge(log.workoutLogged, isTrainingDay && !log.workoutLogged, profile.name)

  const logWorkout = (label) => update({ workoutLogged: true, workoutLabel: label })

  return (
    <div className="screen">
      <h1>Workout 💪</h1>

      {log.workoutLogged ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 24px', borderColor: 'rgba(110, 231, 183, 0.25)', background: 'rgba(110, 231, 183, 0.04)' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(110, 231, 183, 0.12)',
            border: '2px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ marginBottom: 6, color: 'var(--green)' }}>{log.workoutLabel}</h2>
          <p>Session served. You showed up.</p>
        </div>
      ) : (
        <>
          <div className="nudge">{nudge}</div>
          {isTrainingDay && (
            <>
              <p style={{ marginBottom: 16 }}>Did you get a session in today {profile.name}?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(profile.workoutLabels?.length ? profile.workoutLabels : ['Session']).map(label => (
                  <button key={label} className="btn btn-primary" onClick={() => logWorkout(label)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
