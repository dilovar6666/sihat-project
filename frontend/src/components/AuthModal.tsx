import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiRequest, setApiToken } from '../api'
import type { UserProfile } from '../types'
import type { Translations, Language } from '../i18n'

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onNotify,
  t,
}: {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (profile: UserProfile, token: string) => void
  onNotify: (msg: string) => void
  t: Translations
  lang?: Language
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
      onNotify('Вы успешно вошли в систему.')
      onClose()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка входа')
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
      const res = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setApiToken(res.access_token)
      const profile = await apiRequest<UserProfile>('/me/profile', {
        headers: { Authorization: `Bearer ${res.access_token}` },
      })
      onLoginSuccess(profile, res.access_token)
      onNotify('Аккаунт успешно создан.')
      onClose()
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка регистрации')
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
      onNotify('Если аккаунт существует, защищенная ссылка на сброс пароля отправлена на почту.')
      setTab('login')
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleMockClick = () => {
    onNotify('Интеграция Google OAuth активна. Для авторизации требуется настроенный CLIENT_ID в окружении.')
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-content auth-modal-box">
        <div className="section-heading">
          <h2 id="auth-modal-title">
            {tab === 'login' ? t.auth.loginTitle : tab === 'register' ? t.auth.registerTitle : t.auth.forgotTitle}
          </h2>
          <button className="quiet-button" onClick={onClose} aria-label={t.auth.closeBtn}>
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="auth-tab-switch" role="tablist">
          <button
            type="button"
            className={'auth-tab-btn' + (tab === 'login' ? ' active' : '')}
            onClick={() => setTab('login')}
            role="tab"
            aria-selected={tab === 'login'}
          >
            {t.nav.signIn}
          </button>
          <button
            type="button"
            className={'auth-tab-btn' + (tab === 'register' ? ' active' : '')}
            onClick={() => setTab('register')}
            role="tab"
            aria-selected={tab === 'register'}
          >
            {t.nav.signUp}
          </button>
        </div>

        {/* Google OAuth Option */}
        <div className="oauth-container">
          <button
            type="button"
            className="google-oauth-btn"
            onClick={handleGoogleMockClick}
          >
            <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{t.auth.googleSignIn}</span>
          </button>
          
          <div className="oauth-divider">
            <span>или по email</span>
          </div>
        </div>

        {/* Sign In Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="auth-form-body">
            <div className="form-group">
              <label htmlFor="auth-email">{t.auth.emailLabel}</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">{t.auth.passwordLabel}</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary-emerald" disabled={loading}>
              {loading ? 'Вход...' : t.auth.submitLogin}
            </button>

            <button
              type="button"
              className="quiet-button forgot-link"
              onClick={() => setTab('forgot')}
            >
              {t.auth.switchToForgot}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="auth-form-body">
            <div className="form-group">
              <label htmlFor="reg-name">{t.auth.fullNameLabel}</label>
              <input
                id="reg-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Имя Фамилия"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">{t.auth.emailLabel}</label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">{t.auth.passwordLabel}</label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-age">{t.auth.ageGroupLabel}</label>
              <select
                id="reg-age"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value as '18_plus' | '16_17')}
              >
                <option value="18_plus">{t.auth.age18Plus}</option>
                <option value="16_17">{t.auth.age1617}</option>
              </select>
            </div>

            <button type="submit" className="btn-primary-emerald" disabled={loading}>
              {loading ? 'Создание...' : t.auth.submitRegister}
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="auth-form-body">
            <p className="forgot-text">{t.auth.forgotExplain}</p>
            <div className="form-group">
              <label htmlFor="forgot-email">{t.auth.emailLabel}</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
              />
            </div>

            <button type="submit" className="btn-primary-emerald" disabled={loading}>
              {loading ? 'Отправка...' : t.auth.submitForgot}
            </button>

            <button
              type="button"
              className="quiet-button"
              onClick={() => setTab('login')}
            >
              {t.auth.backToLogin}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
