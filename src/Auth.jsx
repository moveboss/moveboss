import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth({ joinCode }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const effectiveCode = joinCode || manualCode.trim() || null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // If we have a join code, link them now
      if (effectiveCode && data?.user) {
        const { data: move } = await supabase.from('moves').select('id').eq('invite_code', effectiveCode).single()
        if (move) await supabase.from('move_members').insert({ move_id: move.id, user_id: data.user.id, email })
      }
      setMessage('Account created! Signing you in...')
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      // If we have a join code, link them on sign in too
      if (effectiveCode && data?.user) {
        const { data: move } = await supabase.from('moves').select('id').eq('invite_code', effectiveCode).single()
        if (move) await supabase.from('move_members').insert({ move_id: move.id, user_id: data.user.id, email }).select()
      }
    }

    setLoading(false)
  }

  return (
    <div className="app">
      <div className="auth-screen">
        <h1 className="logo auth-logo">
          <span className="logo-move">Move</span><span className="logo-boss">Boss</span>
        </h1>
        <p className="auth-tagline">Moving made organized.</p>
        {joinCode && (
          <div className="form-success" style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
            📦 You've been invited to help with a move! Sign in or create an account to join.
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {!joinCode && (
            <div className="form-group">
              <label className="form-label">Join Code <span style={{fontWeight:400, color:'#9ca3af'}}>(optional — if someone invited you)</span></label>
              <input
                className="form-input"
                placeholder="e.g. fde893a7"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
              />
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button className="btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? (
            <>Don't have an account? <button className="btn-link" onClick={() => setMode('signup')}>Sign up</button></>
          ) : (
            <>Already have an account? <button className="btn-link" onClick={() => setMode('login')}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  )
}
