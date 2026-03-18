import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWeightLog } from '../hooks/useWeightLog'
import { calcTrendLine, calcWeeksToGoal } from '../lib/calculations'
import Confetti from '../components/Confetti'

const MILESTONES = [
  { key: 'down2',   check: (start, cur)        => start - cur >= 2,                  msg: () => `2 lbs down 🔥 The cut is real` },
  { key: 'down5',   check: (start, cur)        => start - cur >= 5,                  msg: () => `5 lbs gone 💪 A whole bag of flour lighter` },
  { key: 'halfway', check: (start, cur, goal)  => cur <= start - (start - goal) / 2, msg: (n) => `Halfway there ${n} — the best course is still coming 🌶️` },
  { key: 'goal',    check: (start, cur, goal)  => cur <= goal,                       msg: (n) => `GOAL HIT. Table for one — and you're the main event 🎉🍽️🔥` },
]

const getMilestoneKey       = (profileId) => `cff_milestones_${profileId}`
const getTriggeredMilestones = (profileId) => {
  try { return JSON.parse(localStorage.getItem(getMilestoneKey(profileId)) || '[]') } catch { return [] }
}
const markMilestoneTriggered = (profileId, key) => {
  const existing = getTriggeredMilestones(profileId)
  if (!existing.includes(key)) localStorage.setItem(getMilestoneKey(profileId), JSON.stringify([...existing, key]))
}

const RANGE_OPTIONS = [
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '3m',  label: 'Last 3 months', days: 90 },
  { key: 'all', label: 'All time', days: null },
]

export default function ProgressScreen({ profile }) {
  const { entries, addEntry } = useWeightLog(profile.id)
  const [weight, setWeight]   = useState('')
  const [confetti, setConfetti] = useState(false)
  const [milestone, setMilestone] = useState(null)
  const [timeRange, setTimeRange] = useState('30d')

  const startWeight  = entries.length > 0 ? entries[0].weight : profile.currentWeight
  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight : profile.currentWeight
  const goalWeight   = profile.goalWeight

  // Filter entries by selected time range
  const filteredEntries = useMemo(() => {
    const rangeOpt = RANGE_OPTIONS.find(r => r.key === timeRange)
    if (!rangeOpt?.days) return entries
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - rangeOpt.days)
    const cutoffStr = cutoff.toISOString().split('T')[0]
    return entries.filter(e => e.date >= cutoffStr)
  }, [entries, timeRange])

  const trend = calcTrendLine(
    filteredEntries.length > 0
      ? filteredEntries
      : [{ date: 'Start', weight: startWeight }]
  )
  const chartData = filteredEntries.map((e, i) => ({
    date: e.date.slice(5),
    weight: e.weight,
    trend: trend[i]?.trend,
  }))

  // Weekly rate computed from date span of filtered entries
  const weeklyRate = useMemo(() => {
    if (filteredEntries.length < 2) return 0
    const first   = filteredEntries[0]
    const last    = filteredEntries[filteredEntries.length - 1]
    const daySpan = Math.max(1, (new Date(last.date) - new Date(first.date)) / (1000 * 60 * 60 * 24))
    return ((first.weight - last.weight) / daySpan) * 7
  }, [filteredEntries])

  const weeksLeft = calcWeeksToGoal(latestWeight, goalWeight, weeklyRate > 0 ? weeklyRate : 0)

  // Weekly rate insight card
  const rateInsight = useMemo(() => {
    if (filteredEntries.length < 2) return null
    if (weeklyRate <= 0) return null
    const rate = Math.abs(weeklyRate)
    if (rate >= 0.5 && rate <= 1.0) return {
      headline: `${rate.toFixed(1)} lb/week — healthy pace`,
      body: 'Right in the 0.5–1 lb/week sweet spot for sustainable fat loss.',
      color: 'var(--primary)', bg: 'rgba(45,212,191,0.07)', border: 'rgba(45,212,191,0.15)',
    }
    if (rate > 1.5) return {
      headline: `${rate.toFixed(1)} lb/week — aggressive`,
      body: 'Above 1.5 lb/week. Consider eating slightly more to preserve muscle.',
      color: '#FBBF24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)',
    }
    if (rate < 0.2) return {
      headline: `${rate.toFixed(1)} lb/week — stalling`,
      body: 'Less than 0.2 lb/week. Check your calorie tracking or add activity.',
      color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.04)', border: 'var(--border)',
    }
    return null
  }, [weeklyRate, filteredEntries.length])

  const logWeight = () => {
    const w = Number(weight)
    if (!w || w <= 0) return
    const entry = {
      id: Math.random().toString(36).slice(2),
      profileId: profile.id,
      weight: w,
      weightUnit: profile.weightUnit,
      date: new Date().toISOString().split('T')[0],
    }
    addEntry(entry)

    const triggered = getTriggeredMilestones(profile.id)
    const hit = MILESTONES.find(m => !triggered.includes(m.key) && m.check(startWeight, w, goalWeight))
    if (hit) {
      markMilestoneTriggered(profile.id, hit.key)
      setMilestone(hit.msg(profile.name))
      setConfetti(c => !c)
    }
    setWeight('')
  }

  return (
    <div className="screen">
      <Confetti trigger={confetti} />
      <h1>Progress</h1>

      {milestone && (
        <div className="card" style={{ borderLeft: '3px solid var(--saffron)', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{milestone}</div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Start',      val: `${startWeight} ${profile.weightUnit}` },
          { label: 'Current',    val: `${latestWeight} ${profile.weightUnit}` },
          { label: 'Goal',       val: `${goalWeight} ${profile.weightUnit}` },
          { label: 'Est. weeks', val: weeksLeft === Infinity ? '—' : String(weeksLeft) },
        ].map(({ label, val }) => (
          <div key={label} className="card" style={{
            flex: 1, textAlign: 'center', padding: 12,
            ...(label === 'Current' && { borderColor: 'rgba(45,212,191,0.3)', background: 'rgba(45,212,191,0.05)' }),
            ...(label === 'Goal'    && { borderColor: 'rgba(110,231,183,0.25)' }),
          }}>
            <div style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 16, fontWeight: 700,
              color: label === 'Current' ? 'var(--primary)' : label === 'Goal' ? 'var(--green)' : 'var(--text)',
            }}>
              {val}
            </div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {/* Time range toggle */}
      <div style={{
        display: 'flex', background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        padding: 3, marginBottom: 16, gap: 2,
      }}>
        {RANGE_OPTIONS.map(({ key, label }) => {
          const isActive = key === timeRange
          return (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              style={{
                flex: 1, padding: '7px 4px',
                border: 'none', borderRadius: 6,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
                background: isActive ? 'var(--primary-gradient)' : 'none',
                color: isActive ? '#0A0A0A' : 'var(--text-muted)',
                boxShadow: isActive ? '0 1px 6px var(--primary-glow)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {chartData.length > 1 && (
        <div className="card" style={{ height: 200, padding: 8, marginBottom: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: 'none', color: '#fff' }} />
              <ReferenceLine
                y={goalWeight}
                stroke="var(--green)"
                strokeDasharray="4 4"
                label={{ value: 'Goal', fill: 'var(--green)', fontSize: 11 }}
              />
              <Line type="monotone" dataKey="weight" stroke="var(--primary)" dot={{ fill: 'var(--primary)' }} strokeWidth={2} />
              <Line type="monotone" dataKey="trend"  stroke="#888" strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly rate insight card */}
      {rateInsight && (
        <div style={{
          background: rateInsight.bg,
          border: `1px solid ${rateInsight.border}`,
          borderRadius: 'var(--radius-sm)',
          padding: 12, marginBottom: 12,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: rateInsight.color, marginBottom: 2 }}>
            {rateInsight.headline}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rateInsight.body}</div>
        </div>
      )}

      {/* Log weigh-in */}
      <div className="card">
        <h2>Log weigh-in</h2>
        <p style={{ marginBottom: 14 }}>Time to check in {profile.name} — how's the cut coming?</p>

        {/* Weight stepper */}
        <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 44px', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setWeight(v => {
              const n = parseFloat(v) || 0
              return String(Math.max(0, Math.round((n - 0.1) * 10) / 10))
            })}
            style={{
              height: 44, borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card-2)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >−</button>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              onBlur={e => {
                const n = parseFloat(e.target.value)
                setWeight(isNaN(n) || n < 0 ? '' : String(Math.round(n * 10) / 10))
              }}
              style={{
                textAlign: 'center',
                fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700,
                background: 'none', border: 'none',
                borderBottom: '1.5px solid var(--border)',
                borderRadius: 0, padding: '4px 0', boxShadow: 'none',
                color: 'var(--text)', width: '100%',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {profile.weightUnit}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWeight(v => {
              const n = parseFloat(v) || 0
              return String(Math.round((n + 0.1) * 10) / 10)
            })}
            style={{
              height: 44, borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-tint)', border: '1px solid rgba(45,212,191,0.3)',
              color: 'var(--primary)', fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >+</button>
        </div>

        <button className="btn btn-primary" onClick={logWeight} disabled={!weight}>
          Log weight
        </button>
      </div>
    </div>
  )
}
