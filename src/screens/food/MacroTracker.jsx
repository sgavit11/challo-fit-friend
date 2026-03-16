import MacroCard from '../../components/MacroCard'
import { getMacroNudge } from '../../lib/nudges'

export default function MacroTracker({ log, profile }) {
  const nudge = getMacroNudge(log, profile)
  return (
    <div>
      {nudge && <div className="nudge">{nudge}</div>}
      <MacroCard log={log} targets={profile.targets} />
    </div>
  )
}
