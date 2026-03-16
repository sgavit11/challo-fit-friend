import { motion } from 'framer-motion'
import { useDailyLog } from '../hooks/useDailyLog'
import { getWaterNudge } from '../lib/nudges'
import ProgressBar from '../components/ProgressBar'

const TAP_OZ = 16
const TAP_ML = 470

export default function WaterScreen({ profile }) {
  const { log, update } = useDailyLog(profile.id)
  const isOz = (profile.waterUnit ?? 'oz') === 'oz'
  const tapAmount = isOz ? TAP_OZ : TAP_ML
  const targetDisplay = isOz ? profile.targets.waterOz : Math.round(profile.targets.waterOz * 29.5735)
  const currentDisplay = isOz ? log.waterOz : Math.round(log.waterOz * 29.5735)
  const unit = isOz ? 'oz' : 'ml'
  const nudge = getWaterNudge(log.waterOz, profile)

  const logWater = () => {
    const newOz = log.waterOz + TAP_OZ // always store in oz
    update({ waterOz: newOz })
  }

  const reset = () => update({ waterOz: 0 })

  return (
    <div className="screen">
      <h1>Water 💧</h1>
      <p style={{ marginBottom: 20 }}>One tap = {tapAmount}{unit}</p>

      {nudge && <div className="nudge">{nudge}</div>}

      <div className="card" style={{ textAlign: 'center', marginBottom: 24, padding: '28px 16px', background: 'var(--bg-card-2)' }}>
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 16px', display: 'block' }} stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="rgba(45,212,191,0.12)"/>
        </svg>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4, marginBottom: 6 }}>
          <span className="value" style={{ fontSize: 48, lineHeight: 1 }}>{currentDisplay}</span>
          <span style={{ fontSize: 18, color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>of {targetDisplay}{unit} goal</div>
        <ProgressBar value={log.waterOz} max={profile.targets.waterOz} color="linear-gradient(90deg, #2DD4BF, #38BDF8)" label="" sublabel="" />
      </div>

      <motion.button
        className="btn btn-primary"
        style={{ fontSize: 20, padding: 20, marginBottom: 12 }}
        whileTap={{ scale: 0.90 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        onClick={logWater}
      >
        + {tapAmount}{unit}
      </motion.button>
      <button className="btn btn-secondary" onClick={reset}>Reset today</button>
    </div>
  )
}
