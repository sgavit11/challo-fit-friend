import { useState, useEffect } from 'react'
import { useDailyLog } from '../hooks/useDailyLog'
import { getDailyLog } from '../storage'

// ── Constants ─────────────────────────────────────────────────────
const CIRCUMFERENCE = 2 * Math.PI * 90 // 565.49

const UNIT_PRESETS = {
  oz:     { glass: 8,    can: 12,   bottle: 16,   large: 32,   step: 2,   defaultCustom: 16  },
  glass:  { glass: 1,    can: 1.5,  bottle: 2,    large: 4,    step: 0.5, defaultCustom: 1   },
  ml:     { glass: 250,  can: 500,  bottle: 750,  large: 1000, step: 50,  defaultCustom: 350 },
  custom: { glass: 250,  can: 500,  bottle: 750,  large: 1000, step: 50,  defaultCustom: 350 },
}
const CHIP_LABELS = { oz: 'oz', glass: 'glass', ml: 'ml / L', custom: 'custom' }
const CHIPS = ['oz', 'glass', 'ml', 'custom']
const ML_PER_OZ = 29.5735

// ── Conversion helpers ────────────────────────────────────────────
const toOz = (amount, unit) => {
  if (unit === 'oz') return amount
  if (unit === 'glass') return amount * 8
  return amount / ML_PER_OZ // ml or custom
}

const formatRingValue = (oz, unit) => {
  if (unit === 'oz') return { value: String(Math.round(oz)), unitLabel: 'oz' }
  if (unit === 'glass') {
    const g = oz / 8
    return { value: g % 1 === 0 ? String(g) : g.toFixed(1), unitLabel: 'glasses' }
  }
  const ml = oz * ML_PER_OZ
  if (ml >= 1000) return { value: (ml / 1000).toFixed(1), unitLabel: 'litres' }
  return { value: String(Math.round(ml)), unitLabel: 'ml' }
}

const formatTarget = (targetOz, unit) => {
  if (unit === 'oz') return `${Math.round(targetOz)}oz`
  if (unit === 'glass') return `${Math.round(targetOz / 8)}g`
  const ml = targetOz * ML_PER_OZ
  if (ml >= 1000) return `${(ml / 1000).toFixed(1)}L`
  return `${Math.round(ml)}ml`
}

const formatPresetLabel = (amount, unit) => {
  if (unit === 'oz') return `${amount}oz`
  if (unit === 'glass') return `${amount}g`
  if (amount >= 1000) return `${amount / 1000}L`
  return `${amount}ml`
}

// ── Streak ────────────────────────────────────────────────────────
const computeStreak = (profileId, targetOz, todayOz) => {
  const today = new Date()
  let pastStreak = 0
  let hasAnyData = todayOz > 0

  for (let i = 1; i <= 60; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const dayLog = getDailyLog(profileId, key)
    if (dayLog.waterOz > 0) hasAnyData = true
    if (dayLog.waterOz >= targetOz) {
      pastStreak++
    } else {
      break
    }
  }

  const todayHit = todayOz >= targetOz
  return {
    streak: pastStreak + (todayHit ? 1 : 0),
    pastStreak,
    todayHit,
    hasAnyData,
  }
}

// ── Nudge state ───────────────────────────────────────────────────
const getNudgeState = (oz, targetOz) => {
  if (oz >= targetOz) return 'goal_hit'
  const pct = oz / targetOz
  const hour = new Date().getHours()
  if ((pct < 0.25 && hour >= 14) || (pct < 0.5 && hour >= 18)) return 'behind'
  return null
}

// ── Component ─────────────────────────────────────────────────────
export default function WaterScreen({ profile }) {
  const { log, logWater, deleteWaterEntry } = useDailyLog(profile.id)

  const [unit, setUnit] = useState(() => localStorage.getItem('cff_water_unit') || 'ml')
  const presets = UNIT_PRESETS[unit]
  const [customVal, setCustomVal] = useState(presets.defaultCustom)

  useEffect(() => {
    setCustomVal(UNIT_PRESETS[unit].defaultCustom)
    localStorage.setItem('cff_water_unit', unit)
  }, [unit])

  const targetOz = profile.targets.waterOz
  const currentOz = log.waterOz
  const pct = targetOz > 0 ? Math.min(1, currentOz / targetOz) : 0
  const dashOffset = CIRCUMFERENCE * (1 - pct)
  const goalHit = pct >= 1

  const { streak, pastStreak, todayHit, hasAnyData } = computeStreak(profile.id, targetOz, currentOz)
  const nudge = getNudgeState(currentOz, targetOz)
  const ringDisplay = formatRingValue(currentOz, unit)
  const targetDisplay = formatTarget(targetOz, unit)
  const entries = log.waterEntries ?? []

  const handleQuickAdd = (key) => {
    const oz = toOz(presets[key], unit)
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    logWater({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), oz, label: key, time })
  }

  const handleLogCustom = () => {
    const oz = toOz(customVal, unit)
    if (oz <= 0) return
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
    logWater({ id: Date.now().toString(36) + Math.random().toString(36).slice(2), oz, label: 'custom', time })
  }

  const stepDown = () => setCustomVal(v => Math.max(0, parseFloat((v - presets.step).toFixed(2))))
  const stepUp = () => setCustomVal(v => parseFloat((v + presets.step).toFixed(2)))

  const showStreakLost = streak === 0 && !todayHit && pastStreak === 0 && hasAnyData

  return (
    <div className="screen">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h1 style={{ fontWeight: 800, fontSize: 28, color: '#EDEDF0' }}>Water</h1>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 99, padding: '5px 12px' }}>
            <FireIcon />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FBBF24' }}>{streak} day streak</span>
          </div>
        )}
        {showStreakLost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 99, padding: '5px 12px' }}>
            <FireIcon color="#F87171" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F87171' }}>streak lost</span>
          </div>
        )}
      </div>

      {/* Unit chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {CHIPS.map(c => (
          <button key={c} onClick={() => setUnit(c)} style={{
            padding: '6px 14px', borderRadius: 99,
            background: unit === c ? 'var(--water-tint)' : 'var(--bg-card-2)',
            border: unit === c ? '1px solid rgba(56,189,248,0.4)' : '1px solid var(--border)',
            fontSize: 12, fontWeight: 600,
            color: unit === c ? 'var(--water)' : 'var(--text-muted)',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            {CHIP_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Arc ring */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 16px' }}>
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7DD3FC"/>
              <stop offset="100%" stopColor="#0EA5E9"/>
            </linearGradient>
            <filter id="wGlow">
              <feGaussianBlur stdDeviation={goalHit ? 6 : 4} result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {goalHit && <circle cx="110" cy="110" r="96" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="6"/>}
          {/* Track */}
          <circle cx="110" cy="110" r="90" fill="none" stroke="#1A1A20" strokeWidth="14"/>
          {/* Fill arc */}
          <circle
            cx="110" cy="110" r="90"
            fill="none"
            stroke="url(#wGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 110 110)"
            filter="url(#wGlow)"
          />
          {/* Center content */}
          <text x="110" y="95" textAnchor="middle" fontSize="26" fill="#38BDF8">💧</text>
          <text x="110" y="126" textAnchor="middle" fontFamily="Outfit, sans-serif" fontSize="36" fontWeight="800" fill="#EDEDF0">
            {ringDisplay.value}
          </text>
          <text x="110" y="146" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="13" fill={goalHit ? '#38BDF8' : '#9999AA'} fontWeight={goalHit ? '600' : '400'}>
            {ringDisplay.unitLabel}
          </text>
          <text x="110" y="164" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="12" fill={goalHit ? '#38BDF8' : '#55555F'}>
            {goalHit ? 'goal hit · keep going' : `of ${targetDisplay} · ${Math.round(pct * 100)}% done`}
          </text>
        </svg>
      </div>

      {/* Goal hit nudge */}
      {nudge === 'goal_hit' && (
        <div style={{ background: 'var(--water-tint)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>🎉</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--water)', marginBottom: 2 }}>Daily goal hit!</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {targetDisplay} done. Keep it going{streak > 1 ? ` — you're on a ${streak}-day streak.` : '.'}
            </div>
          </div>
        </div>
      )}

      {/* Behind pace nudge */}
      {nudge === 'behind' && (
        <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 20 }}>⏰</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--chili)', marginBottom: 2 }}>You're behind pace</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Try a quick glass now to catch up to your {targetDisplay} goal.
            </div>
          </div>
        </div>
      )}

      {/* Quick add */}
      <div className="label" style={{ marginBottom: 8 }}>{goalHit ? 'Keep logging' : 'Quick Add'}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {(['glass', 'can', 'bottle', 'large']).map(key => (
          <button key={key} onClick={() => handleQuickAdd(key)} style={{
            padding: '10px 4px',
            background: 'var(--water-tint)',
            border: '1px solid rgba(56,189,248,0.25)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--water)',
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{key}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{formatPresetLabel(presets[key], unit)}</span>
          </button>
        ))}
      </div>

      {/* Custom amount stepper */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '44px 1fr 44px',
          alignItems: 'center', gap: 10,
          background: 'var(--bg-card-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 8,
        }}>
          <button onClick={stepDown} style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text)', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>−</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <input
              type="text" inputMode="decimal" value={customVal}
              onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setCustomVal(v) }}
              style={{
                width: '100%', textAlign: 'center',
                fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 700,
                color: 'var(--text)', background: 'none',
                border: 'none', borderBottom: '1.5px solid var(--border)',
                padding: '2px 0', outline: 'none',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {unit === 'oz' ? 'oz' : unit === 'glass' ? 'glasses' : 'ml'}
            </span>
          </div>
          <button onClick={stepUp} style={{
            width: 44, height: 44, borderRadius: '50%',
            border: '1px solid var(--border)', background: 'var(--bg-card)',
            color: 'var(--text)', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>+</button>
        </div>
        <button onClick={handleLogCustom} style={{
          width: '100%', background: 'var(--water-tint)',
          border: '1px solid rgba(56,189,248,0.3)', color: 'var(--water)',
          padding: 11, borderRadius: 'var(--radius-sm)',
          fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>+ Log custom amount</button>
      </div>

      {/* Today's log */}
      <h2 style={{ color: '#EDEDF0', marginTop: 8 }}>Today's log</h2>
      {entries.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '20px 0' }}>No entries yet — tap a quick add to start</p>
      ) : (
        <div className="card" style={{ padding: '4px 16px' }}>
          {[...entries].reverse().map((entry, idx, arr) => (
            <div key={entry.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0',
              borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--water)', flexShrink: 0 }}/>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 50, flexShrink: 0 }}>{entry.time}</div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
                {formatRingValue(entry.oz, unit).value}{formatRingValue(entry.oz, unit).unitLabel}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{entry.label}</div>
              <button onClick={() => deleteWaterEntry(entry.id)} style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(248,113,113,0.1)', border: 'none',
                color: 'var(--chili)', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

function FireIcon({ color = '#FBBF24' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C8.5 8 4 10.5 4 15a8 8 0 0 0 16 0c0-4.5-4.5-7-8-13z"/>
    </svg>
  )
}
