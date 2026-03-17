import { useState } from 'react'

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const currentYear = new Date().getFullYear()
const FUTURE_YEARS = Array.from({ length: 11 }, (_, i) => currentYear + i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const selectStyle = {
  background: 'var(--bg-input)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '12px 8px', fontSize: 16, width: '100%',
}

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

function isValidDate(month, day, year) {
  if (!month || !day || !year) return false
  const d = new Date(year, month - 1, day)
  return d.getMonth() === month - 1 && d.getDate() === day
}

function toDateString(month, day, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function StepGoal({ weightUnit = 'lbs', onNext }) {
  const isMetric = weightUnit === 'kg'
  const [goalWeight, setGoalWeight] = useState(isMetric ? '68' : '150')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')

  const min = isMetric ? 35 : 80
  const max = isMetric ? 200 : 400
  const num = Number(goalWeight)
  const valid = isValidDate(Number(month), Number(day), Number(year))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your goal</h2>

      <div className="label" style={{ marginBottom: 8 }}>Goal weight ({weightUnit})</div>
      <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', gap: 8, alignItems: 'center', marginBottom: 24 }}>
        <button style={stepBtnStyle} onClick={() => setGoalWeight(String(Math.max(min, num - 1)))}>−</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <input
            type="text"
            inputMode="decimal"
            value={goalWeight}
            onChange={e => { if (/^\d*$/.test(e.target.value)) setGoalWeight(e.target.value) }}
            onBlur={() => setGoalWeight(String(Math.min(max, Math.max(min, num || min))))}
            style={{ textAlign: 'center', width: '100%' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{weightUnit}</span>
        </div>
        <button style={stepBtnStyle} onClick={() => setGoalWeight(String(Math.min(max, num + 1)))}>+</button>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div className="label">Target date</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 2 }}>
            <label className="label" htmlFor="target-month">Month</label>
            <select id="target-month" value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
              <option value="">Month</option>
              {MONTHS.slice(1).map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="label" htmlFor="target-day">Day</label>
            <select id="target-day" value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
              <option value="">Day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label className="label" htmlFor="target-year">Year</label>
            <select id="target-year" value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
              <option value="">Year</option>
              {FUTURE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        disabled={!valid}
        onClick={() => onNext({ goalWeight: Number(goalWeight), targetDate: toDateString(Number(month), Number(day), Number(year)) })}
      >
        Next →
      </button>
    </div>
  )
}
