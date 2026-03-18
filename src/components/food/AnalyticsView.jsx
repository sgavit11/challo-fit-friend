import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, Cell, XAxis, ReferenceLine, Tooltip, ResponsiveContainer,
} from 'recharts'
import { fetchLogRange, useFoodLog } from '../../hooks/useFoodLog'
import { useProfile } from '../../hooks/useProfile'
import {
  calcCalorieTarget,
  calcProteinTarget,
  calcFatTarget,
  calcCarbTarget,
} from '../../lib/calculations'

// ── helpers ──────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getRangeBounds(range) {
  switch (range) {
    case 'day':   return { start: TODAY,            end: TODAY }
    case 'week':  return { start: offsetDate(-6),   end: TODAY }
    case 'month': return { start: offsetDate(-29),  end: TODAY }
    case '6m':    return { start: offsetDate(-181), end: TODAY }
    case 'year':  return { start: offsetDate(-364), end: TODAY }
    default:      return { start: offsetDate(-6),   end: TODAY }
  }
}

// Fill in missing dates with zero so the chart always shows the full range
function fillDateGaps(aggregated, start, end) {
  const map = {}
  for (const row of aggregated) map[row.log_date] = row

  const result = []
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const ds = cur.toISOString().split('T')[0]
    result.push(map[ds] ?? {
      log_date: ds,
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

// Aggregate daily rows into weekly buckets (for 6m range)
function groupByWeek(rows) {
  const weeks = {}
  for (const row of rows) {
    const d = new Date(row.log_date + 'T12:00:00')
    const jan1 = new Date(d.getFullYear(), 0, 1)
    const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
    const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
    if (!weeks[key]) weeks[key] = { label: `W${weekNum}`, total_calories: 0, days: 0 }
    weeks[key].total_calories += row.total_calories
    weeks[key].days += row.total_calories > 0 ? 1 : 0
  }
  return Object.entries(weeks).map(([, v]) => ({
    xLabel: v.label,
    calories: v.days > 0 ? Math.round(v.total_calories / v.days) : 0,
    isToday: false,
  }))
}

// Aggregate daily rows into monthly buckets (for year range)
function groupByMonth(rows) {
  const months = {}
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  for (const row of rows) {
    const d = new Date(row.log_date + 'T12:00:00')
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!months[key]) months[key] = { label: MON[d.getMonth()], total_calories: 0, days: 0 }
    months[key].total_calories += row.total_calories
    months[key].days += row.total_calories > 0 ? 1 : 0
  }
  return Object.entries(months).map(([, v]) => ({
    xLabel: v.label,
    calories: v.days > 0 ? Math.round(v.total_calories / v.days) : 0,
    isToday: false,
  }))
}

function barColor(calories, target, isToday) {
  if (isToday) return 'rgba(45,212,191,0.35)'
  if (calories === 0) return 'rgba(255,255,255,0.06)'
  const delta = Math.abs(calories - target) / target
  if (delta <= 0.10) return '#2DD4BF'
  if (delta <= 0.25) return '#FBBF24'
  return '#F87171'
}

function zoneOf(calories, target) {
  if (calories === 0) return 'empty'
  const delta = Math.abs(calories - target) / target
  if (delta <= 0.10) return 'on-track'
  if (delta <= 0.25) return 'caution'
  return 'flagged'
}

// ── custom tooltip ────────────────────────────────────────────

function CalTooltip({ active, payload, target }) {
  if (!active || !payload?.length) return null
  const cal = payload[0]?.value ?? 0
  if (cal === 0) return null
  const delta = cal - target
  const sign = delta >= 0 ? '+' : ''
  return (
    <div style={{
      background: '#1A1A20', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12,
      color: 'var(--text)',
    }}>
      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 14 }}>
        {cal.toLocaleString()} kcal
      </div>
      <div style={{ color: delta >= 0 ? '#FBBF24' : 'var(--primary)', marginTop: 2 }}>
        {sign}{delta.toLocaleString()} vs target
      </div>
    </div>
  )
}

// ── time range toggle ─────────────────────────────────────────

const RANGES = ['day', 'week', 'month', '6m', 'year']

function RangeToggle({ value, onChange }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      padding: 3, marginBottom: 20, gap: 2,
    }}>
      {RANGES.map(r => {
        const isActive = r === value
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            style={{
              flex: 1, padding: '7px 0',
              border: 'none', borderRadius: 6,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              background: isActive ? 'var(--primary-gradient)' : 'none',
              color: isActive ? '#0A0A0A' : 'var(--text-muted)',
              boxShadow: isActive ? '0 1px 6px var(--primary-glow)' : 'none',
            }}
          >
            {r}
          </button>
        )
      })}
    </div>
  )
}

// ── main component ────────────────────────────────────────────

export default function AnalyticsView() {
  const [range, setRange] = useState('week')
  const [rangeData, setRangeData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const { activeProfile } = useProfile()

  // For "day" range: use useFoodLog to get individual entries
  const { entries: dayEntries, loading: dayLoading } = useFoodLog(range === 'day' ? TODAY : null)

  const targets = useMemo(() => {
    if (!activeProfile) return { calories: 2000, protein: 150, carbs: 200, fat: 65 }
    const cal = calcCalorieTarget(activeProfile)
    const pro = calcProteinTarget(activeProfile.weight ?? 160)
    const fat = calcFatTarget(cal)
    const carb = calcCarbTarget(cal, pro, fat)
    return { calories: cal, protein: pro, carbs: carb, fat }
  }, [activeProfile])

  // Fetch range data whenever range changes (skip for "day")
  useEffect(() => {
    if (range === 'day') return
    const { start, end } = getRangeBounds(range)
    setLoading(true)
    setError(null)
    fetchLogRange(start, end).then(({ data, error: fetchError }) => {
      if (fetchError) {
        setError(fetchError)
      } else {
        setRangeData(fillDateGaps(data, start, end))
      }
      setLoading(false)
    })
  }, [range])

  // ── Compute chart data ──────────────────────────────────────

  const chartData = useMemo(() => {
    if (range === 'day') {
      return dayEntries.map(e => ({
        xLabel: e.name.length > 8 ? e.name.slice(0, 8) + '…' : e.name,
        calories: Math.round(e.calories),
        isToday: true,
        isEntry: true,
      }))
    }
    if (range === '6m') return groupByWeek(rangeData)
    if (range === 'year') return groupByMonth(rangeData)

    const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return rangeData.map(row => ({
      xLabel: row.log_date === TODAY
        ? 'Today'
        : DAY_SHORT[new Date(row.log_date + 'T12:00:00').getDay()],
      calories: Math.round(row.total_calories),
      isToday: row.log_date === TODAY,
    }))
  }, [range, rangeData, dayEntries])

  // ── Summary stats ───────────────────────────────────────────

  const loggedDays = useMemo(
    () => rangeData.filter(r => r.total_calories > 0),
    [rangeData]
  )

  const avgCalories = loggedDays.length
    ? Math.round(loggedDays.reduce((s, r) => s + r.total_calories, 0) / loggedDays.length)
    : 0

  const onTrackCount = loggedDays.filter(
    r => Math.abs(r.total_calories - targets.calories) / targets.calories <= 0.10
  ).length

  // ── Avg macros for macro breakdown card ────────────────────

  const avgMacros = useMemo(() => {
    if (!loggedDays.length) return { protein: 0, carbs: 0, fat: 0 }
    const sums = rangeData.reduce((a, r) => ({
      protein: a.protein + r.total_protein,
      carbs:   a.carbs   + r.total_carbs,
      fat:     a.fat     + r.total_fat,
    }), { protein: 0, carbs: 0, fat: 0 })
    const n = loggedDays.length
    return {
      protein: Math.round(sums.protein / n),
      carbs:   Math.round(sums.carbs   / n),
      fat:     Math.round(sums.fat     / n),
    }
  }, [rangeData, loggedDays])

  const totalMacroG = avgMacros.protein + avgMacros.carbs + avgMacros.fat
  const proP  = totalMacroG ? Math.round(avgMacros.protein / totalMacroG * 100) : 33
  const carbP = totalMacroG ? Math.round(avgMacros.carbs   / totalMacroG * 100) : 34
  const fatP  = totalMacroG ? 100 - proP - carbP : 33

  // ── Insight callout cards ───────────────────────────────────

  const insights = useMemo(() => {
    if (range === 'day' || !loggedDays.length) return []
    const cards = []
    const DAY_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dayLabel = (ds) => ds === TODAY ? 'Today' : DAY_SHORT[new Date(ds + 'T12:00:00').getDay()]

    const flagged = loggedDays.filter(r => zoneOf(r.total_calories, targets.calories) === 'flagged')
    const caution = loggedDays.filter(r => zoneOf(r.total_calories, targets.calories) === 'caution')

    for (const r of flagged) {
      const pct = Math.round(Math.abs(r.total_calories - targets.calories) / targets.calories * 100)
      const dir = r.total_calories < targets.calories ? 'under' : 'over'
      cards.push({
        type: 'flagged',
        headline: `${dayLabel(r.log_date)} was ${pct}% ${dir}`,
        body: `${Math.round(r.total_calories).toLocaleString()} kcal logged${dir === 'under' ? ' — did you miss a meal or forget to log?' : ' — try balancing with lighter meals.'}`,
      })
    }
    for (const r of caution.slice(0, 1)) {
      const pct = Math.round(Math.abs(r.total_calories - targets.calories) / targets.calories * 100)
      const dir = r.total_calories < targets.calories ? 'under' : 'over'
      cards.push({
        type: 'caution',
        headline: `${dayLabel(r.log_date)} was ${pct}% ${dir}`,
        body: `${Math.round(r.total_calories).toLocaleString()} kcal — just outside your zone. Easy to balance.`,
      })
    }
    if (onTrackCount >= 3) {
      cards.push({
        type: 'positive',
        headline: `${onTrackCount} day${onTrackCount !== 1 ? 's' : ''} on track`,
        body: `Within ±10% of your ${targets.calories.toLocaleString()} kcal target. Solid consistency.`,
      })
    }
    return cards
  }, [range, loggedDays, targets.calories, onTrackCount])

  const isLoading = range === 'day' ? dayLoading : loading

  // ── render ────────────────────────────────────────────────

  return (
    <div>
      <RangeToggle value={range} onChange={setRange} />

      {/* Summary pills — week and above only */}
      {range !== 'day' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Avg / day',  value: avgCalories ? avgCalories.toLocaleString() : '—', sub: 'kcal', gradient: true },
            { label: 'Target',     value: targets.calories.toLocaleString(),                sub: 'kcal' },
            { label: 'On track',   value: loggedDays.length ? `${onTrackCount}/${loggedDays.length}` : '—', sub: 'days (±10%)', green: true },
          ].map(({ label, value, sub, gradient, green }) => (
            <div key={label} style={{
              flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
            }}>
              <div className="label">{label}</div>
              <div style={{
                fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700,
                ...(gradient && { background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }),
                ...(green && { color: 'var(--green)' }),
                ...(!gradient && !green && { color: 'var(--text)' }),
              }}>
                {value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Calorie chart card */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '16px 12px 10px',
        marginBottom: 12, boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div className="label">Calories</div>
          {range !== 'day' && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {getRangeBounds(range).start.slice(5).replace('-', '/')} – {TODAY.slice(5).replace('-', '/')}
            </div>
          )}
        </div>

        {isLoading ? (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading…
          </div>
        ) : error ? (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chili)', fontSize: 13 }}>
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data logged yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Log meals in the Log tab to see your trends here.</div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} margin={{ top: 8, right: 36, left: 0, bottom: 0 }} barCategoryGap="25%">
                <ReferenceLine
                  y={targets.calories}
                  stroke="rgba(45,212,191,0.6)" strokeWidth={1.5} strokeDasharray="5 3"
                  label={{ value: `${Math.round(targets.calories / 100) / 10}k`, position: 'right', fill: 'rgba(45,212,191,0.8)', fontSize: 8, fontFamily: 'DM Sans' }}
                />
                <ReferenceLine y={targets.calories * 1.10} stroke="rgba(45,212,191,0.18)" strokeWidth={1} strokeDasharray="3 4" />
                <ReferenceLine y={targets.calories * 0.90} stroke="rgba(45,212,191,0.18)" strokeWidth={1} strokeDasharray="3 4" />
                <XAxis
                  dataKey="xLabel"
                  tick={{ fill: 'var(--text-muted)', fontSize: 9, fontFamily: 'DM Sans' }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CalTooltip target={targets.calories} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="calories" radius={[5, 5, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={barColor(entry.calories, targets.calories, entry.isToday)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              {[
                { color: 'linear-gradient(180deg,#2DD4BF,#38BDF8)', label: 'On track' },
                { color: '#FBBF24', label: 'Caution' },
                { color: '#F87171', label: 'Off track' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Macro breakdown card — week and above, with data */}
      {range !== 'day' && loggedDays.length > 0 && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 12px 14px',
          marginBottom: 12, boxShadow: 'var(--shadow-sm)',
        }}>
          <div className="label" style={{ marginBottom: 12 }}>
            Avg Macro Split —{' '}
            {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : range === '6m' ? 'Last 6 Months' : 'This Year'}
          </div>

          {/* Stacked horizontal bar */}
          <div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', marginBottom: 12, gap: 2 }}>
            <div style={{ width: `${proP}%`, background: 'var(--green)', borderRadius: '99px 0 0 99px' }} />
            <div style={{ width: `${carbP}%`, background: 'var(--blue)' }} />
            <div style={{ width: `${fatP}%`, background: 'var(--purple)', borderRadius: '0 99px 99px 0' }} />
          </div>

          {/* Macro rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Protein', val: avgMacros.protein, target: targets.protein, color: 'var(--green)' },
              { label: 'Carbs',   val: avgMacros.carbs,   target: targets.carbs,   color: 'var(--blue)' },
              { label: 'Fat',     val: avgMacros.fat,     target: targets.fat,     color: 'var(--purple)' },
            ].map(({ label, val, target, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{label}</div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 700, color }}>{val}g</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 50, textAlign: 'right' }}>/ {target}g avg</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight callout cards */}
      {insights.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insights.map((ins, idx) => {
            const styles = {
              flagged:  { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)',  color: 'var(--chili)',   icon: '🚩' },
              caution:  { bg: 'rgba(251,191,36,0.07)',  border: 'rgba(251,191,36,0.2)',   color: '#FBBF24',        icon: '⚠️' },
              positive: { bg: 'rgba(45,212,191,0.07)',  border: 'rgba(45,212,191,0.15)',  color: 'var(--primary)', icon: '✅' },
            }[ins.type]
            return (
              <div key={idx} style={{
                background: styles.bg,
                border: `1px solid ${styles.border}`,
                borderRadius: 'var(--radius-sm)',
                padding: 12,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <div style={{ fontSize: 16, marginTop: 1 }}>{styles.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: styles.color, marginBottom: 2 }}>{ins.headline}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ins.body}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
