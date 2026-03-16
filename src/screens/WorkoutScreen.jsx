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
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 64 }}>🔥</div>
          <h2 style={{ marginTop: 12 }}>{log.workoutLabel}</h2>
          <p style={{ marginTop: 4 }}>Session served. You showed up.</p>
        </div>
      ) : (
        <>
          <div className="nudge">{nudge}</div>
          {isTrainingDay && (
            <>
              <p style={{ marginBottom: 16 }}>Did you get a session in today {profile.name}? 💪</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(profile.workoutLabels?.length ? profile.workoutLabels : ['Session']).map(label => (
                  <button key={label} className="btn btn-primary" onClick={() => logWorkout(label)}>
                    ✅ {label}
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
