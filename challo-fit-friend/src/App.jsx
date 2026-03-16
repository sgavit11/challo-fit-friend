import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProfile } from './hooks/useProfile'
import BottomNav from './components/BottomNav'
import OnboardingFlow from './onboarding/OnboardingFlow'
import ProfileSwitcher from './onboarding/ProfileSwitcher'
import HomeScreen from './screens/HomeScreen'
import FoodScreen from './screens/FoodScreen'
import WaterScreen from './screens/WaterScreen'
import ProgressScreen from './screens/ProgressScreen'
import WorkoutScreen from './screens/WorkoutScreen'
import SettingsScreen from './screens/SettingsScreen'

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeInOut' } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } },
}

export default function App() {
  const { profiles, activeProfile, addOrUpdateProfile, removeProfile, switchProfile } = useProfile()
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  if (profiles.length === 0) {
    return (
      <OnboardingFlow
        onComplete={(profile) => { addOrUpdateProfile(profile); switchProfile(profile.id) }}
      />
    )
  }

  if (!activeProfile) {
    return (
      <ProfileSwitcher
        profiles={profiles}
        onSelect={switchProfile}
        onAddComplete={(profile) => { addOrUpdateProfile(profile); switchProfile(profile.id) }}
      />
    )
  }

  if (showSettings) {
    return (
      <SettingsScreen
        profile={activeProfile}
        onUpdate={addOrUpdateProfile}
        onBack={() => setShowSettings(false)}
      />
    )
  }

  const screenProps = { profile: activeProfile, onOpenSettings: () => setShowSettings(true) }
  const SCREENS = {
    home: <HomeScreen {...screenProps} />,
    food: <FoodScreen {...screenProps} />,
    water: <WaterScreen {...screenProps} />,
    progress: <ProgressScreen {...screenProps} />,
    workout: <WorkoutScreen {...screenProps} />,
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ width: '100%' }}
        >
          {SCREENS[tab]}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
