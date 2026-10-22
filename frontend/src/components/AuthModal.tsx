import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest, setApiToken } from '../api'
import type { UserProfile } from '../types'

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onNotify,
}: {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (profile: UserProfile, token: string) => void
  onNotify: (msg: string) => void
}) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [ageGroup, setAgeGroup] = useState<'18_plus' | '16_17'>('18_plus')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setApiToken(res.access_token)
      const profile = await apiRequest<UserProfile>('/me/profile', {
        headers: { Authorization: `Bearer ${res.access_token}` },
      })
      onLoginSuccess(profile, res.access_token)
      onNotify('Signed in successfully.')
      onClose()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName, age_group: ageGroup }),
      })
      // Automatically log in upon successful registration
      const res = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setApiToken(res.access_token)
      const profile = await apiRequest<UserProfile>('/me/profile', {
        headers: { Authorization: `Bearer ${res.access_token}` },
      })
      onLoginSuccess(profile, res.access_token)
      onNotify('Account created and signed in.')
      onClose()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await apiRequest('/auth/reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      onNotify('If an account exists, a single-use password recovery email was dispatched.')
      setTab('login')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Reset request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <div className="section-heading">
          <h2>{tab === 'login' ? 'Sign In to SIHAT' : tab === 'register' ? 'Create Account' : 'Password Recovery'}</h2>
          <button className="quiet-button" onClick={onClose}>Close</button>
        </div>

        <div className="nav-tabs" style={{ marginBottom: '16px' }}>
          <button className={'nav-tab' + (tab === 'login' ? ' active' : '')} onClick={() => setTab('login')}>Sign In</button>
          <button className={'nav-tab' + (tab === 'register' ? ' active' : '')} onClick={() => setTab('register')}>Register</button>
        </div>

        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'grid', gap: '14px', textAlign: 'left' }}>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
            <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <button type="button" className="quiet-button" style={{ fontSize: '.85rem' }} onClick={() => setTab('forgot')}>
              Forgot your password?
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'grid', gap: '14px', textAlign: 'left' }}>
            <label>Full Name<input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" /></label>
            <label>Age Group
              <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as '18_plus' | '16_17')}>
                <option value="18_plus">18 years or older</option>
                <option value="16_17">16 - 17 years</option>
              </select>
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
          </form>
        )}

        {tab === 'forgot' && (
          <form onSubmit={handleForgot} style={{ display: 'grid', gap: '14px', textAlign: 'left' }}>
            <p style={{ fontSize: '.85rem', color: '#566e63', margin: 0 }}>
              Enter your email address to receive a secure recovery link.
            </p>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <button type="submit" disabled={loading}>Send Recovery Email</button>
            <button type="button" className="quiet-button" onClick={() => setTab('login')}>Back to Sign In</button>
          </form>
        )}
      </div>
    </div>
  )
}
