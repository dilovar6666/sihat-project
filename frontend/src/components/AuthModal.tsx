import React, { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Mail, Lock, User, KeyRound, AlertTriangle, ExternalLink } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { apiRequest, setApiToken, setRefreshToken } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string) => void
  lang?: Language
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
  lang = 'ru',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [ageGroup, setAgeGroup] = useState('18_plus')
  const [loading, setLoading] = useState(false)
  const [showGoogleHelp, setShowGoogleHelp] = useState(false)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  const labels = {
    ru: {
      titleLogin: 'Вход в аккаунт SIHAT',
      titleRegister: 'Создать личный профиль',
      subLogin: 'Войдите для доступа к личной истории скринингов',
      subRegister: 'Безопасное хранение ваших осознанных результатов',
      tabLogin: 'Войти',
      tabRegister: 'Регистрация',
      nameLabel: 'Полное имя',
      namePlaceholder: 'Иван Петров',
      emailLabel: 'Email',
      passLabel: 'Пароль',
      passPlaceholder: 'Минимум 8 символов',
      ageLabel: 'Возрастная категория',
      age18: '18 лет и старше',
      age1617: '16–17 лет',
      submitLogin: 'Войти в систему',
      submitRegister: 'Создать аккаунт',
      orDivider: 'или',
      googleOriginNotice: 'Для работы кнопки Google добавьте домен http://127.0.0.1:5173 в Google Cloud Console.',
      googleHelpToggle: 'Инструкция для Google входа',
      devLoginBtn: '⚡ Быстрый вход: Dilovar (Admin)',
      loginSuccess: 'Добро пожаловать в SIHAT!',
      regSuccess: 'Аккаунт успешно создан!',
      googleSuccess: 'Успешный вход через Google',
    },
    tj: {
      titleLogin: 'Воридшавӣ ба ҳисоби SIHAT',
      titleRegister: 'Эҷоди профили шахсӣ',
      subLogin: 'Барои дастрасӣ ба бойгонии натиҷаҳои скрининг ворид шавед',
      subRegister: 'Нигоҳдории амни натиҷаҳои шахсии шумо',
      tabLogin: 'Воридшавӣ',
      tabRegister: 'Бақайдгирӣ',
      nameLabel: 'Ному насаб',
      namePlaceholder: 'Дилшод Раҳимов',
      emailLabel: 'Почтаи электронӣ',
      passLabel: 'Рамз',
      passPlaceholder: 'Ҳадди ақал 8 аломат',
      ageLabel: 'Гурӯҳи синну сол',
      age18: '18 сола ва калонтар',
      age1617: '16–17 сола',
      submitLogin: 'Воридшавӣ ба система',
      submitRegister: 'Эҷоди ҳисоб',
      orDivider: 'ё',
      googleOriginNotice: 'Барои кори тугмаи Google суроғаи http://127.0.0.1:5173 -ро дар Google Cloud илова намоед.',
      googleHelpToggle: 'Дастури танзими Google Login',
      devLoginBtn: '⚡ Воридшавии фаврӣ: Dilovar (Admin)',
      loginSuccess: 'Хуш омадед ба SIHAT!',
      regSuccess: 'Ҳисоби шумо бомуваффақият эҷод шуд!',
      googleSuccess: 'Воридшавии бомуваффақият тавассути Google',
    },
    en: {
      titleLogin: 'Sign in to SIHAT',
      titleRegister: 'Create Personal Profile',
      subLogin: 'Sign in to access your private screening archive',
      subRegister: 'Secure evidence-based personal health logging',
      tabLogin: 'Sign In',
      tabRegister: 'Register',
      nameLabel: 'Full Name',
      namePlaceholder: 'Alex Smith',
      emailLabel: 'Email',
      passLabel: 'Password',
      passPlaceholder: 'Minimum 8 characters',
      ageLabel: 'Age Group',
      age18: '18 years and older',
      age1617: '16–17 years',
      submitLogin: 'Sign In',
      submitRegister: 'Create Account',
      orDivider: 'or',
      googleOriginNotice: 'For Google Sign-In, add http://127.0.0.1:5173 to Authorized Origins in Google Cloud Console.',
      googleHelpToggle: 'Google Auth Setup Guide',
      devLoginBtn: '⚡ Quick Dev Login: Dilovar (Admin)',
      loginSuccess: 'Welcome to SIHAT!',
      regSuccess: 'Account successfully registered!',
      googleSuccess: 'Google Sign-In successful',
    },
  }[lang] || {
    titleLogin: 'Sign in to SIHAT',
    titleRegister: 'Create Personal Profile',
    subLogin: 'Sign in to access your private screening archive',
    subRegister: 'Secure evidence-based personal health logging',
    tabLogin: 'Sign In',
    tabRegister: 'Register',
    nameLabel: 'Full Name',
    namePlaceholder: 'Alex Smith',
    emailLabel: 'Email',
    passLabel: 'Password',
    passPlaceholder: 'Minimum 8 characters',
    ageLabel: 'Age Group',
    age18: '18 years and older',
    age1617: '16–17 years',
    submitLogin: 'Sign In',
    submitRegister: 'Create Account',
    orDivider: 'or',
    googleOriginNotice: 'For Google Sign-In, add http://127.0.0.1:5173 to Authorized Origins in Google Cloud Console.',
    googleHelpToggle: 'Google Auth Setup Guide',
    devLoginBtn: '⚡ Quick Dev Login: Dilovar (Admin)',
    loginSuccess: 'Welcome to SIHAT!',
    regSuccess: 'Account successfully registered!',
    googleSuccess: 'Google Sign-In successful',
  }

  useEffect(() => {
    if (!isOpen) return
    const win = window as any
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId) {
      clientId = clientId.replace(/^https?:\/\//, '').trim()
    }
    if (!clientId || !win.google) return

    try {
      win.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            const res = await apiRequest<{ access_token: string; refresh_token: string; user: UserProfile }>(
              '/auth/google',
              {
                method: 'POST',
                body: JSON.stringify({
                  id_token: response.credential,
                  age_group: ageGroup,
                }),
              }
            )
            setApiToken(res.access_token)
            setRefreshToken(res.refresh_token)
            onSuccess(res.user, res.access_token)
            onClose()
            onNotify(labels.googleSuccess)
          } catch (err: unknown) {
            onNotify(err instanceof Error ? err.message : 'Google OAuth Error')
          }
        },
      })

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = ''
        win.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: mode === 'login' ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
          logo_alignment: 'center',
        })
      }
    } catch (e: any) {
      console.warn('Google Identity initialization:', e)
    }
  }, [isOpen, mode, ageGroup, labels.googleSuccess])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            age_group: ageGroup,
          }),
        })
      }

      const res = await apiRequest<{ access_token: string; refresh_token: string; user: UserProfile }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      )

      setApiToken(res.access_token)
      setRefreshToken(res.refresh_token)
      onSuccess(res.user, res.access_token)
      onClose()
      onNotify(mode === 'register' ? labels.regSuccess : labels.loginSuccess)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = async () => {
    setLoading(true)
    try {
      const res = await apiRequest<{ access_token: string; refresh_token: string; user: UserProfile }>(
        '/auth/dev-login',
        { method: 'POST' }
      )
      setApiToken(res.access_token)
      setRefreshToken(res.refresh_token)
      onSuccess(res.user, res.access_token)
      onClose()
      onNotify(lang === 'tj' ? 'Воридшавии фаврии мудир бомуваффақият анҷом ёфт!' : lang === 'en' ? 'Quick Admin Login successful!' : 'Вход администратора Dilovar выполнен успешно!')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Dev login error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
            {mode === 'login' ? labels.titleLogin : labels.titleRegister}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {mode === 'login' ? labels.subLogin : labels.subRegister}
          </p>
        </div>

        {/* Development Quick-Login Button */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/20 gap-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>{labels.devLoginBtn}</span>
          </Button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {labels.tabLogin}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {labels.tabRegister}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {labels.nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={labels.namePlaceholder}
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {labels.emailLabel}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {labels.passLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={labels.passPlaceholder}
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {labels.ageLabel}
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="18_plus">{labels.age18}</option>
                <option value="16_17">{labels.age1617}</option>
              </select>
            </div>
          )}

          <Button
            type="submit"
            variant="emerald"
            disabled={loading}
            className="w-full py-2.5 mt-2"
          >
            {mode === 'login' ? labels.submitLogin : labels.submitRegister}
          </Button>
        </form>

        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-400">{labels.orDivider}</span>
          </div>
        </div>

        {/* Google OAuth Render Container */}
        <div className="flex flex-col items-center w-full gap-2 min-h-[44px]">
          <div ref={googleBtnRef} className="w-full flex justify-center" />

          {/* Diagnostic Note for Google Auth Origin */}
          <div className="w-full text-center">
            <button
              type="button"
              onClick={() => setShowGoogleHelp(!showGoogleHelp)}
              className="text-[11px] text-zinc-400 hover:text-emerald-500 transition-colors inline-flex items-center gap-1"
            >
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>{labels.googleHelpToggle}</span>
            </button>

            {showGoogleHelp && (
              <div className="mt-2 p-3 text-left bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                  {labels.googleOriginNotice}
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Откройте Google Cloud Console Credentials</li>
                  <li>Добавьте в <b>Authorized JavaScript origins</b>: <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">http://127.0.0.1:5173</code> и <code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">http://localhost:5173</code></li>
                  <li>Нажмите Save (Сохранить).</li>
                </ol>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline pt-1"
                >
                  <span>Google Cloud Console ↗</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Quick Dev Login button */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {labels.devLoginBtn}
          </button>
        </div>
      </div>
    </Modal>
  )
}
