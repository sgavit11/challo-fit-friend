import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StepName from './StepName'
import StepDOB from './StepDOB'
import StepStats from './StepStats'
import StepGoal from './StepGoal'
import StepTraining from './StepTraining'
import StepTDEE from './StepTDEE'
import { saveProfile as persistProfile, setActiveProfileId } from '../storage'

const genId = () => Math.random().toString(36).slice(2)

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeInOut' } },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } }),
}

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState({})
  const [done, setDone] = useState(false)
  const [finalName, setFinalName] = useState('')
  const [completionProfile, setCompletionProfile] = useState(null)

  useEffect(() => {
    if (!completionProfile) return
    const timer = setTimeout(() => onComplete(completionProfile), 1800)
    return () => clearTimeout(timer)
  }, [completionProfile, onComplete])

  const TOTAL_STEPS = 6

  const advance = (updates) => {
    setDirection(1)
    if (step < TOTAL_STEPS - 1) {
      setData(prev => ({ ...prev, ...updates }))
      setStep(s => s + 1)
    } else {
      const profile = {
        id: genId(),
        name: data.name,
        dob: data.dob,
        sex: data.sex || 'm',
        currentWeight: data.currentWeight,
        height: data.height,
        weightUnit: data.weightUnit,
        heightUnit: data.heightUnit,
        goalWeight: data.goalWeight,
        targetDate: data.targetDate,
        trainingDays: data.trainingDays,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        workoutLabels: data.workoutLabels,
        waterUnit: updates.waterUnit || 'oz',
        targets: {
          calories: updates.calories,
          protein: updates.protein,
          fat: updates.fat,
          carbs: updates.carbs,
          waterOz: updates.waterOz,
          steps: updates.steps,
        },
        calorieGuardrails: { underPercent: 60, overPercent: 110 },
        createdAt: new Date().toISOString().split('T')[0],
      }
      // Persist synchronously before animation delay — prevents data loss on reload
      persistProfile(profile)
      setActiveProfileId(profile.id)
      setFinalName(data.name)
      setDone(true)
      setCompletionProfile(profile)
    }
  }

  const goBack = () => {
    if (step === 0) return
    setDirection(-1)
    setStep(s => s - 1)
  }

  if (done) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minHeight: '100dvh' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🍽️🔥</div>
        <h1>You're all set {finalName}.</h1>
        <p style={{ marginTop: 8 }}>Your journey starts now.</p>
        <p style={{ marginTop: 4, color: 'var(--saffron)', fontWeight: 600 }}>Challo let's go 🍽️🔥</p>
        {completionProfile && (
          <button
            className="btn btn-primary"
            style={{ marginTop: 32 }}
            onClick={() => onComplete(completionProfile)}
          >
            Continue →
          </button>
        )}
      </div>
    )
  }

  const STEPS = [
    <StepName onNext={advance} />,
    <StepDOB onNext={advance} />,
    <StepStats onNext={advance} />,
    <StepGoal weightUnit={data.weightUnit || 'lbs'} onNext={advance} />,
    <StepTraining onNext={advance} />,
    <StepTDEE profile={data} onNext={advance} />,
  ]

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--saffron)' : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {step > 0 && (
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--saffron)',
          cursor: 'pointer', padding: '8px 16px', fontSize: 16,
        }}>
          ← Back
        </button>
      )}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {STEPS[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
