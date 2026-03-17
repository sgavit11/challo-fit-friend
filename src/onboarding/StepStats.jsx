import { useState } from 'react'

const pillLayout = { flex: 1, padding: '10px 0', borderRadius: 8 }
const chipClass = (active) => `chip${active ? ' chip-active' : ''}`

const stepBtnStyle = {
  width: 44, height: 44,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-input)',
  color: 'var(--text)',
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}

function Stepper({ value, onChange, min, max, unit }) {
  const num = Number(value)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', gap: 8, alignItems: 'center' }}>
      <button style={stepBtnStyle} onClick={() => onChange(String(Math.max(min, num - 1)))}>−</button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={e => { if (/^\d*$/.test(e.target.value)) onChange(e.target.value) }}
          onBlur={() => onChange(String(Math.min(max, Math.max(min, num || min))))}
          style={{ textAlign: 'center', width: '100%' }}
        />
        {unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{unit}</span>}
      </div>
      <button style={stepBtnStyle} onClick={() => onChange(String(Math.min(max, num + 1)))}>+</button>
    </div>
  )
}

export default function StepStats({ onNext }) {
  const [isMetric, setIsMetric] = useState(false)
  const [sex, setSex] = useState('m')
  const [weightLbs, setWeightLbs] = useState('160')
  const [weightKg, setWeightKg] = useState('73')
  const [feet, setFeet] = useState('5')
  const [inches, setInches] = useState('10')
  const [cm, setCm] = useState('178')

  const handleNext = () => {
    const weightUnit = isMetric ? 'kg' : 'lbs'
    const heightUnit = isMetric ? 'cm' : 'in'
    const currentWeight = isMetric ? Number(weightKg) : Number(weightLbs)
    const height = isMetric ? Number(cm) : Number(feet) * 12 + Number(inches)
    onNext({ currentWeight, height, weightUnit, heightUnit, sex })
  }

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your current stats</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={chipClass(!isMetric)} style={pillLayout} onClick={() => setIsMetric(false)}>Imperial</button>
        <button className={chipClass(isMetric)} style={pillLayout} onClick={() => setIsMetric(true)}>Metric</button>
      </div>

      <div className="label">Sex</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button className={chipClass(sex === 'm')} style={pillLayout} onClick={() => setSex('m')} aria-label="Male">Male</button>
        <button className={chipClass(sex === 'f')} style={pillLayout} onClick={() => setSex('f')} aria-label="Female">Female</button>
      </div>

      <div className="label">Weight</div>
      <div style={{ marginBottom: 24 }}>
        {isMetric
          ? <Stepper value={weightKg} onChange={setWeightKg} min={35} max={200} unit="kg" />
          : <Stepper value={weightLbs} onChange={setWeightLbs} min={80} max={400} unit="lbs" />
        }
      </div>

      <div className="label">Height</div>
      <div style={{ marginBottom: 32 }}>
        {isMetric ? (
          <Stepper value={cm} onChange={setCm} min={130} max={230} unit="cm" />
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Stepper value={feet} onChange={setFeet} min={3} max={7} unit="ft" />
            </div>
            <div style={{ flex: 1 }}>
              <Stepper value={inches} onChange={setInches} min={0} max={11} unit="in" />
            </div>
          </div>
        )}
      </div>

      <button className="btn btn-primary" onClick={handleNext}>Next →</button>
    </div>
  )
}
