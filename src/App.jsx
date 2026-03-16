import { useState } from 'react'
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

export default function App() {
  const { profiles, activeProfile, addOrUpdateProfile, removeProfile, switchProfile } = useProfile()
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  // No profiles → run onboarding
  if (profiles.length === 0) {
    return (
      <OnboardingFlow
        onComplete={(profile) => {
          addOrUpdateProfile(profile)
          switchProfile(profile.id)
        }}
      />
    )
  }

  // Has profiles but none active → show profile switcher
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
      <>
        <SettingsScreen
          profile={activeProfile}
          onUpdate={addOrUpdateProfile}
          onBack={() => setShowSettings(false)}
        />
      </>
    )
  }

  const screenProps = { profile: activeProfile, onOpenSettings: () => setShowSettings(true) }

  return (
    <>
      {tab === 'home'     && <HomeScreen    {...screenProps} />}
      {tab === 'food'     && <FoodScreen    {...screenProps} />}
      {tab === 'water'    && <WaterScreen   {...screenProps} />}
      {tab === 'progress' && <ProgressScreen {...screenProps} />}
      {tab === 'workout'  && <WorkoutScreen  {...screenProps} />}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </>
  )
}
