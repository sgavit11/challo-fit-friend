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

      <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>💧</div>
        <div className="value" style={{ fontSize: 36 }}>{currentDisplay}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>{unit}</span></div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>of {targetDisplay}{unit} goal</div>
        <div style={{ marginTop: 16 }}>
          <ProgressBar value={log.waterOz} max={profile.targets.waterOz} color="#60A5FA" label="" sublabel="" />
        </div>
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
