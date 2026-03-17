import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthScreen({ onSuccess }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else if (mode === 'signup') {
      setSuccessMsg('Check your email to confirm your account, then log in.')
      setMode('login')
    } else {
      onSuccess?.()
    }
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh', paddingBottom: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 4 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p>{mode === 'login' ? 'Sign in to access your food log.' : 'Track your food across devices.'}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div className="label">Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <div className="label">Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--chili)', fontSize: 13, padding: '10px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248,113,113,0.2)' }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="nudge">{successMsg}</div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ marginTop: 4, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccessMsg(null) }}
        style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--primary)', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
      >
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
