import { useState } from 'react'
import ScrollPicker from '../components/ScrollPicker'

const LBS_OPTIONS = Array.from({ length: 321 }, (_, i) => String(80 + i))
const KG_OPTIONS = Array.from({ length: 166 }, (_, i) => String(35 + i))
const FEET_OPTIONS = ['3', '4', '5', '6', '7']
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i))
const CM_OPTIONS = Array.from({ length: 101 }, (_, i) => String(130 + i))

const pillBtn = (active) => ({
  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
  cursor: 'pointer', fontWeight: 600,
  background: active ? 'var(--saffron)' : 'var(--bg-input)',
  color: active ? '#000' : 'var(--text-muted)',
})

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
        <button style={pillBtn(!isMetric)} onClick={() => setIsMetric(false)}>Imperial</button>
        <button style={pillBtn(isMetric)} onClick={() => setIsMetric(true)}>Metric</button>
      </div>

      <div className="label">Sex</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={pillBtn(sex === 'm')} onClick={() => setSex('m')} aria-label="Male">Male</button>
        <button style={pillBtn(sex === 'f')} onClick={() => setSex('f')} aria-label="Female">Female</button>
      </div>

      <div className="label">Weight</div>
      <div style={{ marginBottom: 24 }}>
        {isMetric
          ? <ScrollPicker options={KG_OPTIONS} value={weightKg} onChange={setWeightKg} />
          : <ScrollPicker options={LBS_OPTIONS} value={weightLbs} onChange={setWeightLbs} />
        }
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {isMetric ? `${weightKg} kg` : `${weightLbs} lbs`}
        </div>
      </div>

      <div className="label">Height</div>
      <div style={{ marginBottom: 32 }}>
        {isMetric ? (
          <>
            <ScrollPicker options={CM_OPTIONS} value={cm} onChange={setCm} />
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {cm} cm
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <ScrollPicker options={FEET_OPTIONS} value={feet} onChange={setFeet} />
              </div>
              <div style={{ flex: 1 }}>
                <ScrollPicker options={INCHES_OPTIONS} value={inches} onChange={setInches} />
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {feet}' {inches}"
            </div>
          </>
        )}
      </div>

      <button className="btn btn-primary" onClick={handleNext}>Next →</button>
    </div>
  )
}
