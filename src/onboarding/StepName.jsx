import { useState } from 'react'

export default function StepName({ onNext }) {
  const [name, setName] = useState('')
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="emoji" style={{ marginBottom: 12 }}>🚀</div>
        <h1>Challo — let's set you up in 60 seconds</h1>
      </div>
      <div className="label">What's your name?</div>
      <input
        type="text"
        placeholder="e.g. Shreyas"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom: 24 }}
        autoFocus
      />
      <button className="btn btn-primary" onClick={() => name.trim() && onNext({ name: name.trim() })} disabled={!name.trim()}>
        Next →
      </button>
    </div>
  )
}
