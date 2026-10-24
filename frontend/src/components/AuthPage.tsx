import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  Activity,
  HeartPulse,
  AlertTriangle,
} from 'lucide-react'
import { Button } from './ui/Button'
import { apiRequest, setApiToken, setRefreshToken } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
)

interface GoogleAuthButtonProps {
  mode: 'login' | 'register'
  ageGroup: string
  lang: Language
  labels: {
    orDivider: string
    googleBtn: string
    googleLoginBtn: string
    googleRegisterBtn: string
    googleSuccess: string
    googleHelpToggle: string
    googleOriginNotice: string
  }
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string) => void
  onNavigate: (pageId: string) => void
  disabled?: boolean
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode,
  ageGroup,
  lang,
  labels,
  onSuccess,
  onNotify,
  onNavigate,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCredentialResponse = async (response: any) => {
    if (!response?.credential) return
    setLoading(true)
    try {
      const data = await apiRequest<{
        access_token: string
        refresh_token: string
        user: UserProfile
      }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          id_token: response.credential,
          age_group: ageGroup,
        }),
      })
      setApiToken(data.access_token)
      setRefreshToken(data.refresh_token)
      onSuccess(data.user, data.access_token)
      onNotify(labels.googleSuccess)
      onNavigate('profile')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Google OAuth Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (rawClientId) {
      rawClientId = rawClientId.replace(/^https?:\/\//, '').trim()
    }
    if (!rawClientId) return

    let cancelled = false
    let attempts = 0

    const renderGsi = () => {
      const win = window as any
      if (!win.google?.accounts?.id || !containerRef.current || cancelled) return

      try {
        win.google.accounts.id.initialize({
          client_id: rawClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          const isDark = document.documentElement.classList.contains('dark')
          const containerWidth = Math.min(
            Math.max(containerRef.current.offsetWidth || 340, 240),
            400
          )

          win.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            text: mode === 'register' ? 'signup_with' : 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: containerWidth,
            locale: lang === 'tj' ? 'ru' : lang,
          })
          setGoogleReady(true)
        }
      } catch (err) {
        console.warn('Google GSI render error:', err)
      }
    }

    if ((window as any).google?.accounts?.id) {
      renderGsi()
    } else {
      const timer = setInterval(() => {
        attempts++
        if ((window as any).google?.accounts?.id) {
          clearInterval(timer)
          renderGsi()
        } else if (attempts >= 15) {
          clearInterval(timer)
        }
      }, 200)
      return () => {
        cancelled = true
        clearInterval(timer)
      }
    }

    return () => {
      cancelled = true
    }
  }, [mode, ageGroup, lang])

  const handleCustomTrigger = () => {
    const win = window as any
    if (win.google?.accounts?.id) {
      win.google.accounts.id.prompt()
    } else {
      onNotify('Google Identity Services загружается. Пожалуйста, подождите или проверьте соединение.')
    }
  }

  return (
    <div className="w-full mt-4">
      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold tracking-wider">
            {labels.orDivider}
          </span>
        </div>
      </div>

      {/* Google Button in SIHAT Signature styling */}
      <div className="w-full flex flex-col items-center gap-2">
        <div className="w-full flex justify-center items-center min-h-[44px] rounded-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-[#17A884] dark:hover:border-[#2EC4A7] hover:shadow-md hover:shadow-[#17A884]/10 transition-all p-0.5">
          <div ref={containerRef} className="w-full flex justify-center items-center" />
          {!googleReady && (
            <button
              type="button"
              disabled={disabled || loading}
              onClick={handleCustomTrigger}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-slate-700 dark:text-slate-200 font-bold text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              <span>{mode === 'register' ? labels.googleRegisterBtn : labels.googleLoginBtn}</span>
            </button>
          )}
        </div>

        {/* Diagnostic info toggle */}
        <div className="w-full text-center mt-0.5">
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-[11px] text-slate-400 hover:text-[#17A884] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
            <span>{labels.googleHelpToggle}</span>
          </button>

          {showHelp && (
            <div className="mt-2 p-3 text-left bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed shadow-xs">
              <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#17A884]" />
                <span>{labels.googleOriginNotice}</span>
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Авторизация осуществляется через официальный Google Identity Services (GSI) по безопасному протоколу OAuth 2.0.
              </p>
              <div className="text-[11px] bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">
                  Разрешённые Origins в Google Cloud Console:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <code className="bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono text-[10px]">
                    http://127.0.0.1:5173
                  </code>
                  <code className="bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-mono text-[10px]">
                    http://localhost:5173
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot-password' | 'reset-password'
  lang: Language
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string) => void
  onNavigate: (pageId: string) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  lang,
  onSuccess,
  onNotify,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>(
    initialMode
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [ageGroup, setAgeGroup] = useState('18_plus')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  const t = {
    ru: {
      loginTitle: 'Вход в аккаунт SIHAT',
      loginSubtitle: 'Войдите для доступа к личному архиву скринингов и динамике показателей.',
      registerTitle: 'Создать личный профиль',
      registerSubtitle: 'Приватное и безопасное пространство для контроля вашего здоровья.',
      forgotTitle: 'Восстановление пароля',
      forgotSubtitle: 'Введите адрес электронной почты для получения ссылки сброса.',
      resetTitle: 'Установка нового пароля',
      resetSubtitle: 'Введите полученный токен и новый безопасный пароль.',
      emailLabel: 'Электронная почта (Email)',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Пароль',
      passwordPlaceholder: 'Минимум 8 символов',
      fullNameLabel: 'Ваше имя или псевдоним',
      fullNamePlaceholder: 'Иван Петров',
      ageLabel: 'Возрастная категория',
      age18: '18 лет и старше (Взрослый контур)',
      age1617: '16–17 лет (Юношеский контур)',
      tokenLabel: 'Токен сброса пароля',
      tokenPlaceholder: 'Вставьте токен из письма',
      newPasswordLabel: 'Новый пароль',
      newPasswordPlaceholder: 'Минимум 8 символов',
      loginBtn: 'Войти в систему',
      registerBtn: 'Зарегистрироваться',
      sendResetBtn: 'Отправить ссылку для сброса',
      setNewPasswordBtn: 'Сохранить новый пароль',
      orDivider: 'или',
      googleBtn: 'Продолжить с Google',
      googleLoginBtn: 'Войти через Google',
      googleRegisterBtn: 'Регистрация через Google',
      googleSuccess: 'Успешный вход через Google',
      googleHelpToggle: 'Инструкция по настройке Google входа',
      googleOriginNotice: 'Для работы Google авторизации домен должен быть разрешён в Google Cloud Console.',
      noAccount: 'Ещё нет аккаунта?',
      hasAccount: 'Уже есть профиль?',
      forgotPassLink: 'Забыли пароль?',
      backToLogin: 'Вернуться ко входу',
      backToHome: 'На главную',
      privacyNote: 'Ваши данные защищены сквозным шифрованием. Мы не передаем биометрические маркеры третьим лицам.',
      resetSentMsg: 'Если указанный адрес зарегистрирован, письмо с инструкцией отправлено.',
      resetSuccessMsg: 'Пароль успешно обновлен. Теперь вы можете войти.',
      brandTitle: 'SIHAT — UNDERSTAND YOUR HEALTH',
      brandDesc: 'Премиальная цифровая психофизиология и доказательный скрининг когнитивно-моторных функций.',
      badgeIso: 'ISO 8596 & Open Science',
      badgePrivacy: 'Zero-Retention Architecture',
    },
    tj: {
      loginTitle: 'Воридшавӣ ба ҳисоби SIHAT',
      loginSubtitle: 'Барои дастрасӣ ба бойгонии шахсии скринингҳо ва динамикаи нишондиҳандаҳо ворид шавед.',
      registerTitle: 'Эҷоди профили шахсӣ',
      registerSubtitle: 'Муҳити амн ва маҳрамона барои назорати саломатии шумо.',
      forgotTitle: 'Барқароркунии рамз',
      forgotSubtitle: 'Почтаи электрониро барои гирифтани пайванди барқароркунӣ ворид намоед.',
      resetTitle: 'Муқаррар кардани рамзи нав',
      resetSubtitle: 'Токени гирифташуда ва рамзи навро ворид намоед.',
      emailLabel: 'Почтаи электронӣ (Email)',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Рамз',
      passwordPlaceholder: 'Ҳадди ақал 8 аломат',
      fullNameLabel: 'Ному насаб ё тахаллус',
      fullNamePlaceholder: 'Дилшод Раҳимов',
      ageLabel: 'Гурӯҳи синну сол',
      age18: '18 сола ва калонтар',
      age1617: '16–17 сола',
      tokenLabel: 'Токени барқароркунӣ',
      tokenPlaceholder: 'Токенро аз мактуб гузоред',
      newPasswordLabel: 'Рамзи нав',
      newPasswordPlaceholder: 'Ҳадди ақал 8 аломат',
      loginBtn: 'Воридшавӣ ба система',
      registerBtn: 'Бақайдгирӣ',
      sendResetBtn: 'Ирсоли пайванд',
      setNewPasswordBtn: 'Сабти рамзи нав',
      orDivider: 'ё',
      googleBtn: 'Идома додан бо Google',
      googleLoginBtn: 'Воридшавӣ тавассути Google',
      googleRegisterBtn: 'Бақайдгирӣ тавассути Google',
      googleSuccess: 'Воридшавии бомуваффақият тавассути Google',
      googleHelpToggle: 'Дастури танзими воридшавии Google',
      googleOriginNotice: 'Барои кори воридшавии Google суроғаи сайт бояд дар Google Cloud иҷозат дода шавад.',
      noAccount: 'Ҳанӯз ҳисоб надоред?',
      hasAccount: 'Аллакай ҳисоб доред?',
      forgotPassLink: 'Рамзро фаромӯш кардед?',
      backToLogin: 'Бозгашт ба воридшавӣ',
      backToHome: 'Ба саҳифаи асосӣ',
      privacyNote: 'Маълумоти шумо таҳти ҳимояи махфӣ қарор дорад.',
      resetSentMsg: 'Мактуб барои барқароркунии рамз ирсол шуд.',
      resetSuccessMsg: 'Рамз нав карда шуд. Акнун ворид шавед.',
      brandTitle: 'SIHAT — UNDERSTAND YOUR HEALTH',
      brandDesc: 'Скрининги исботшудаи когнитивӣ ва мотории саломатӣ.',
      badgeIso: 'ISO 8596 & Open Science',
      badgePrivacy: 'Zero-Retention Architecture',
    },
    en: {
      loginTitle: 'Sign In to SIHAT',
      loginSubtitle: 'Access your private screening archive and cognitive biomarker history.',
      registerTitle: 'Create Private Profile',
      registerSubtitle: 'Confidential and evidence-based self-monitoring platform.',
      forgotTitle: 'Password Recovery',
      forgotSubtitle: 'Enter your email address to receive password reset instructions.',
      resetTitle: 'Set New Password',
      resetSubtitle: 'Enter your recovery token and new secure password.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@example.com',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Minimum 8 characters',
      fullNameLabel: 'Full Name or Alias',
      fullNamePlaceholder: 'John Doe',
      ageLabel: 'Age Group',
      age18: '18+ years (Adult protocol)',
      age1617: '16–17 years (Adolescent protocol)',
      tokenLabel: 'Reset Token',
      tokenPlaceholder: 'Paste token from email',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Minimum 8 characters',
      loginBtn: 'Sign In',
      registerBtn: 'Create Account',
      sendResetBtn: 'Send Reset Link',
      setNewPasswordBtn: 'Save New Password',
      orDivider: 'or',
      googleBtn: 'Continue with Google',
      googleLoginBtn: 'Continue with Google',
      googleRegisterBtn: 'Sign up with Google',
      googleSuccess: 'Google Sign-In successful',
      googleHelpToggle: 'Google Sign-In Setup Guide',
      googleOriginNotice: 'For Google Sign-In, ensure the domain is authorized in Google Cloud Console.',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have a profile?',
      forgotPassLink: 'Forgot password?',
      backToLogin: 'Back to Sign In',
      backToHome: 'Back to Home',
      privacyNote: 'Your health data is protected with end-to-end security and zero-retention defaults.',
      resetSentMsg: 'If that email exists, reset instructions have been dispatched.',
      resetSuccessMsg: 'Password updated successfully. You can now sign in.',
      brandTitle: 'SIHAT — UNDERSTAND YOUR HEALTH',
      brandDesc: 'Premium psychophysiological screening and open scientific methodologies.',
      badgeIso: 'ISO 8596 & Open Science',
      badgePrivacy: 'Zero-Retention Architecture',
    },
  }[lang]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    try {
      const data = await apiRequest<{
        access_token: string
        refresh_token: string
        user: UserProfile
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setApiToken(data.access_token)
      setRefreshToken(data.refresh_token)
      onSuccess(data.user, data.access_token)
      onNotify('Вход успешно выполнен!')
      onNavigate('profile')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка авторизации')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) return
    setLoading(true)
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          age_group: ageGroup,
        }),
      })

      // Auto-login after registration
      const data = await apiRequest<{
        access_token: string
        refresh_token: string
        user: UserProfile
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setApiToken(data.access_token)
      setRefreshToken(data.refresh_token)
      onSuccess(data.user, data.access_token)
      onNotify('Аккаунт успешно создан!')
      onNavigate('profile')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setForgotSent(true)
      onNotify(t.resetSentMsg)
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Ошибка отправки запроса')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetToken || !newPassword) return
    setLoading(true)
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken, new_password: newPassword }),
      })
      onNotify(t.resetSuccessMsg)
      setMode('login')
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Неверный или просроченный токен')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Left Side: Brand & Visual Heritage */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#103D35] via-[#124d43] to-[#17A884] p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#2EC4A7]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#103D35]/80 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
                <HeartPulse className="w-7 h-7 text-[#2EC4A7]" />
              </div>
              <div>
                <span className="text-xl font-black tracking-widest text-white uppercase block">
                  SIHAT
                </span>
                <span className="text-[10px] tracking-widest text-[#DDF5EB] uppercase font-bold">
                  UNDERSTAND YOUR HEALTH
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug mb-4">
              {mode === 'register' ? t.registerTitle : t.brandTitle}
            </h2>
            <p className="text-sm text-white/80 leading-relaxed mb-6">{t.brandDesc}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#2EC4A7] shrink-0" />
                <span>{t.badgeIso}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-xs font-semibold">
                <Activity className="w-4 h-4 text-[#2EC4A7] shrink-0" />
                <span>{t.badgePrivacy}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/15 mt-8">
            <p className="text-xs text-white/70 leading-relaxed">{t.privacyNote}</p>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#17A884] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToHome}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#17A884]/15 text-[#103D35] dark:text-[#2EC4A7]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#17A884]/15 text-[#103D35] dark:text-[#2EC4A7]'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Регистрация
              </button>
            </div>
          </div>

          {/* Mode 1: LOGIN */}
          {mode === 'login' && (
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {t.loginTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t.loginSubtitle}</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {t.passwordLabel}
                    </label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-[#17A884] hover:underline cursor-pointer"
                    >
                      {t.forgotPassLink}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#103D35] hover:bg-[#17A884] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#17A884]/20 transition-all mt-2 cursor-pointer"
                >
                  {loading ? '...' : t.loginBtn}
                </Button>
              </form>

              {/* Google Sign-In */}
              <GoogleAuthButton
                mode="login"
                ageGroup={ageGroup}
                lang={lang}
                labels={t}
                onSuccess={onSuccess}
                onNotify={onNotify}
                onNavigate={onNavigate}
                disabled={loading}
              />

              <div className="mt-8 text-center">
                <span className="text-xs text-slate-500">{t.noAccount} </span>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-bold text-[#17A884] hover:underline cursor-pointer"
                >
                  {t.registerBtn}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: REGISTER */}
          {mode === 'register' && (
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {t.registerTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t.registerSubtitle}</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.fullNameLabel}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.ageLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between transition-all ${
                        ageGroup === '18_plus'
                          ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{t.age18}</span>
                      <input
                        type="radio"
                        name="age"
                        value="18_plus"
                        checked={ageGroup === '18_plus'}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="hidden"
                      />
                    </label>

                    <label
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer flex items-center justify-between transition-all ${
                        ageGroup === '16_17'
                          ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{t.age1617}</span>
                      <input
                        type="radio"
                        name="age"
                        value="16_17"
                        checked={ageGroup === '16_17'}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#103D35] hover:bg-[#17A884] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#17A884]/20 transition-all mt-2 cursor-pointer"
                >
                  {loading ? '...' : t.registerBtn}
                </Button>
              </form>

              {/* Google Sign-Up */}
              <GoogleAuthButton
                mode="register"
                ageGroup={ageGroup}
                lang={lang}
                labels={t}
                onSuccess={onSuccess}
                onNotify={onNotify}
                onNavigate={onNavigate}
                disabled={loading}
              />

              <div className="mt-8 text-center">
                <span className="text-xs text-slate-500">{t.hasAccount} </span>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-[#17A884] hover:underline cursor-pointer"
                >
                  {t.loginBtn}
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: FORGOT PASSWORD */}
          {mode === 'forgot-password' && (
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {t.forgotTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t.forgotSubtitle}</p>

              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm mb-6 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">{t.resetSentMsg}</p>
                    <button
                      type="button"
                      onClick={() => setMode('reset-password')}
                      className="text-xs underline font-bold mt-2 inline-block cursor-pointer"
                    >
                      Ввести токен сброса пароля →
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#103D35] hover:bg-[#17A884] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#17A884]/20 transition-all mt-2 cursor-pointer"
                  >
                    {loading ? '...' : t.sendResetBtn}
                  </Button>
                </form>
              )}

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-[#17A884] hover:underline cursor-pointer"
                >
                  ← {t.backToLogin}
                </button>
              </div>
            </div>
          )}

          {/* Mode 4: RESET PASSWORD */}
          {mode === 'reset-password' && (
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                {t.resetTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t.resetSubtitle}</p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.tokenLabel}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder={t.tokenPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    {t.newPasswordLabel}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t.newPasswordPlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:border-[#17A884] focus:ring-2 focus:ring-[#17A884]/20 transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#103D35] hover:bg-[#17A884] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#17A884]/20 transition-all mt-2 cursor-pointer"
                >
                  {loading ? '...' : t.setNewPasswordBtn}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-bold text-[#17A884] hover:underline cursor-pointer"
                >
                  ← {t.backToLogin}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
