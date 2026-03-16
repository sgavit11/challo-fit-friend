import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWeightLog } from '../hooks/useWeightLog'
import { calcTrendLine, calcWeeksToGoal } from '../lib/calculations'
import Confetti from '../components/Confetti'

const MILESTONES = [
  { key: 'down2', check: (start, cur) => start - cur >= 2, msg: (n) => `2 lbs down 🔥 The cut is real` },
  { key: 'down5', check: (start, cur) => start - cur >= 5, msg: (n) => `5 lbs gone 💪 A whole bag of flour lighter` },
  { key: 'halfway', check: (start, cur, goal) => cur <= start - (start - goal) / 2, msg: (n) => `Halfway there ${n} — the best course is still coming 🌶️` },
  { key: 'goal', check: (start, cur, goal) => cur <= goal, msg: (n) => `GOAL HIT. Table for one — and you're the main event 🎉🍽️🔥` },
]

const getMilestoneKey = (profileId) => `cff_milestones_${profileId}`
const getTriggeredMilestones = (profileId) => {
  try { return JSON.parse(localStorage.getItem(getMilestoneKey(profileId)) || '[]') } catch { return [] }
}
const markMilestoneTriggered = (profileId, key) => {
  const existing = getTriggeredMilestones(profileId)
  if (!existing.includes(key)) localStorage.setItem(getMilestoneKey(profileId), JSON.stringify([...existing, key]))
}

export default function ProgressScreen({ profile }) {
  const { entries, addEntry } = useWeightLog(profile.id)
  const [weight, setWeight] = useState('')
  const [confetti, setConfetti] = useState(false)
  const [milestone, setMilestone] = useState(null)

  const startWeight = entries.length > 0 ? entries[0].weight : profile.currentWeight
  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight : profile.currentWeight
  const goalWeight = profile.goalWeight

  const trend = calcTrendLine(entries.length > 0 ? entries : [{ date: 'Start', weight: startWeight }])
  const weeklyLoss = entries.length > 1
    ? (startWeight - latestWeight) / (entries.length - 1)
    : 0
  const weeksLeft = calcWeeksToGoal(latestWeight, goalWeight, weeklyLoss)

  const logWeight = () => {
    const w = Number(weight)
    if (!w || w <= 0) return
    const entry = { id: Math.random().toString(36).slice(2), profileId: profile.id, weight: w, weightUnit: profile.weightUnit, date: new Date().toISOString().split('T')[0] }
    addEntry(entry)

    const triggered = getTriggeredMilestones(profile.id)
    const hit = MILESTONES.find(m => !triggered.includes(m.key) && m.check(startWeight, w, goalWeight))
    if (hit) {
      markMilestoneTriggered(profile.id, hit.key)
      setMilestone(hit.msg(profile.name))
      setConfetti(c => !c) // toggle to re-trigger
    }
    setWeight('')
  }

  const chartData = entries.map((e, i) => ({ date: e.date.slice(5), weight: e.weight, trend: trend[i]?.trend }))

  return (
    <div className="screen">
      <Confetti trigger={confetti} />
      <h1>Progress 📈</h1>

      {milestone && (
        <div className="card" style={{ borderLeft: '3px solid var(--saffron)', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{milestone}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Start', val: `${startWeight} ${profile.weightUnit}` },
          { label: 'Current', val: `${latestWeight} ${profile.weightUnit}` },
          { label: 'Goal', val: `${goalWeight} ${profile.weightUnit}` },
          { label: 'Est. weeks', val: weeksLeft === Infinity ? '—' : String(weeksLeft) },
        ].map(({ label, val }) => (
          <div key={label} className="card" style={{
          flex: 1, textAlign: 'center', padding: 12,
          ...(label === 'Current' && { borderColor: 'rgba(45,212,191,0.3)', background: 'rgba(45,212,191,0.05)' }),
          ...(label === 'Goal' && { borderColor: 'rgba(110,231,183,0.25)' }),
        }}>
            <div style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 16, fontWeight: 700,
            color: label === 'Current' ? 'var(--primary)' : label === 'Goal' ? 'var(--green)' : 'var(--text)',
          }}>{val}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="card" style={{ height: 200, padding: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis domain={['auto','auto']} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: 'none', color: '#fff' }} />
              <ReferenceLine y={goalWeight} stroke="#4CAF6F" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#4CAF6F', fontSize: 11 }} />
              <Line type="monotone" dataKey="weight" stroke="#F5A623" dot={{ fill: '#F5A623' }} strokeWidth={2} />
              <Line type="monotone" dataKey="trend" stroke="#888" strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h2>Log weigh-in ⚖️</h2>
        <p style={{ marginBottom: 12 }}>Time to check in {profile.name} — how's the cut coming?</p>
        <input type="number" placeholder={`Weight in ${profile.weightUnit}`} value={weight}
          onChange={e => setWeight(e.target.value)} style={{ marginBottom: 12 }} />
        <button className="btn btn-primary" onClick={logWeight} disabled={!weight}>
          Log weight
        </button>
      </div>
    </div>
  )
}
