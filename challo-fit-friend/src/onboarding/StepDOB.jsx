import { useState } from 'react'

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 91 }, (_, i) => currentYear - 10 - i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const selectStyle = {
  background: 'var(--bg-input)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '12px 8px', fontSize: 16, width: '100%',
}

function isValidDOB(month, day, year) {
  if (!month || !day || !year) return false
  const d = new Date(year, month - 1, day)
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return false
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return age >= 10 && age <= 100
}

function toDobString(month, day, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function StepDOB({ onNext }) {
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const valid = isValidDOB(Number(month), Number(day), Number(year))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>When were you born?</h2>
      <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>
        Used to calculate your calorie target.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <div style={{ flex: 2 }}>
          <label className="label" htmlFor="dob-month">Month</label>
          <select id="dob-month" value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
            <option value="">Month</option>
            {MONTHS.slice(1).map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label" htmlFor="dob-day">Day</label>
          <select id="dob-day" value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
            <option value="">Day</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label className="label" htmlFor="dob-year">Year</label>
          <select id="dob-year" value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
            <option value="">Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <button
        className="btn btn-primary"
        disabled={!valid}
        onClick={() => onNext({ dob: toDobString(Number(month), Number(day), Number(year)) })}
      >
        Next →
      </button>
    </div>
  )
}
