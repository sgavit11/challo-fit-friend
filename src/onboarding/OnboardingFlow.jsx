import { useState, useEffect } from 'react'
import StepName from './StepName'
import StepStats from './StepStats'
import StepGoal from './StepGoal'
import StepTraining from './StepTraining'
import StepTargets from './StepTargets'

const genId = () => Math.random().toString(36).slice(2)

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [done, setDone] = useState(false)
  const [finalName, setFinalName] = useState('')
  const [completionProfile, setCompletionProfile] = useState(null)

  // Delay onComplete so the completion screen shows for 1.8s before App switches views
  useEffect(() => {
    if (!completionProfile) return
    const timer = setTimeout(() => onComplete(completionProfile), 1800)
    return () => clearTimeout(timer)
  }, [completionProfile, onComplete])

  const advance = (updates) => {
    if (step < 4) {
      setData(prev => ({ ...prev, ...updates }))
      setStep(s => s + 1)
    } else {
      // Last step: updates IS the targets object — build full profile from accumulated data
      const profile = {
        id: genId(),
        name: data.name,
        currentWeight: data.currentWeight,
        height: data.height,
        weightUnit: data.weightUnit,
        heightUnit: data.heightUnit,
        goalWeight: data.goalWeight,
        targetDate: data.targetDate,
        trainingDays: data.trainingDays,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        workoutLabels: data.workoutLabels,
        targets: updates,
        calorieGuardrails: { underPercent: 60, overPercent: 110 },
        createdAt: new Date().toISOString().split('T')[0],
      }
      setFinalName(data.name)
      setDone(true)
      setCompletionProfile(profile)
    }
  }

  if (done) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minHeight: '100dvh' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🍽️🔥</div>
        <h1>You're all set {finalName}.</h1>
        <p style={{ marginTop: 8 }}>Your journey starts now.</p>
        <p style={{ marginTop: 4, color: 'var(--saffron)', fontWeight: 600 }}>Challo let's go 🍽️🔥</p>
      </div>
    )
  }

  const STEPS = [
    <StepName onNext={advance} />,
    <StepStats onNext={advance} />,
    <StepGoal weightUnit={data.weightUnit || 'lbs'} onNext={advance} />,
    <StepTraining onNext={advance} />,
    <StepTargets profile={data} onNext={advance} />,
  ]

  return (
    <div>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--saffron)' : 'var(--border)',
          }} />
        ))}
      </div>
      {STEPS[step]}
    </div>
  )
}
