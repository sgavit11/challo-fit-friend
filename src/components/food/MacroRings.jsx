// MacroRings — SVG progress rings showing calorie + macro progress
// Props: totals { calories, protein, carbs, fat }
//        targets { calories, protein, carbs, fat }

const HERO_R = 46
const HERO_C = 2 * Math.PI * HERO_R   // ≈ 289

const RING_R = 20
const RING_C = 2 * Math.PI * RING_R   // ≈ 126

function pct(value, target) {
  if (!target) return 0
  return Math.min(value / target, 1)
}

function HeroRing({ value, target }) {
  const offset = HERO_C * (1 - pct(value, target))
  return (
    <div style={{ position: 'relative', width: 110, height: 110 }}>
      <svg
        width="110" height="110" viewBox="0 0 110 110"
        style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
      >
        <circle cx="55" cy="55" r={HERO_R} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="55" cy="55" r={HERO_R}
          fill="none"
          stroke="url(#calGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={HERO_C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <defs>
          <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700,
          color: 'var(--text)', lineHeight: 1,
        }}>
          {value.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          / {target.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function MacroRing({ value, target, label, color }) {
  const offset = RING_C * (1 - pct(value, target))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg
        width="52" height="52" viewBox="0 0 52 52"
        style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}
      >
        <circle cx="26" cy="26" r={RING_R} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="26" cy="26" r={RING_R}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div>
        <div style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 15, fontWeight: 700,
          color: 'var(--text)',
        }}>
          {value}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>g</span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
          textTransform: 'uppercase', color,
        }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ {target}g</div>
      </div>
    </div>
  )
}

export default function MacroRings({ totals, targets }) {
  const calPct = pct(totals.calories, targets.calories)
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 12px 16px',
      marginBottom: 12,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0 4px',
      }}>
        {/* Hero: Calories */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <HeroRing value={Math.round(totals.calories)} target={targets.calories} />
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            Calories
          </div>
          <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'var(--primary-gradient)',
              width: `${Math.min(calPct * 100, 100)}%`,
            }} />
          </div>
        </div>

        {/* Macro rings column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <MacroRing value={Math.round(totals.protein * 10) / 10} target={targets.protein} label="Protein" color="var(--green)" />
          <MacroRing value={Math.round(totals.carbs * 10) / 10}   target={targets.carbs}   label="Carbs"   color="var(--blue)" />
          <MacroRing value={Math.round(totals.fat * 10) / 10}     target={targets.fat}     label="Fat"     color="var(--purple)" />
        </div>
      </div>
    </div>
  )
}
