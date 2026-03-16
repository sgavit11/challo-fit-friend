import { useState } from 'react'
import OnboardingFlow from './OnboardingFlow'

export default function ProfileSwitcher({ profiles, onSelect, onAddComplete }) {
  const [addingNew, setAddingNew] = useState(false)

  if (addingNew) {
    return (
      <OnboardingFlow
        onComplete={(profile) => {
          onAddComplete(profile)
          setAddingNew(false)
        }}
      />
    )
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
        <h1>Who's using the app?</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {profiles.map(p => (
          <button key={p.id} className="btn btn-secondary" onClick={() => onSelect(p.id)}
            style={{ fontSize: 18, padding: 20 }}>
            {p.name}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => setAddingNew(true)}>
        + Add profile
      </button>
    </div>
  )
}
