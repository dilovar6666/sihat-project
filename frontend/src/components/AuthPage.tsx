import React, { useState, useEffect, useRef } from 'react'
import {
  Mail,
  Lock,
  User,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  HeartPulse,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react'
import { apiRequest, setApiToken, setRefreshToken } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

/* ==========================================================================
   SVG SOCIAL ICONS (Google, Facebook, Apple)
   ========================================================================== */

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

const FacebookIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const AppleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.66-.82 1.11-1.96.99-3.1-.96.04-2.12.64-2.8 1.44-.6.69-1.12 1.82-.98 2.93 1.07.08 2.15-.49 2.79-1.27z" />
  </svg>
)

/* ==========================================================================
   GOOGLE GSI INTEGRATION
   ========================================================================== */

interface GoogleAuthButtonProps {
  mode: 'login' | 'register'
  ageGroup: string
  lang: Language
  labels: Record<string, string>
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string) => void
  onNavigate: (pageId: string) => void
  disabled?: boolean
}

const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  ageGroup,
  labels,
  onSuccess,
  onNotify,
  onNavigate,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false)
  const gsiContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let unmounted = false
    const win = window as any
    let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '26582096896-d1k7bij57g2cekc2k7u41pba24gdp4t1.apps.googleusercontent.com'
    if (clientId) {
      clientId = clientId.replace(/^https?:\/\//, '').trim()
    }

    const initGsi = () => {
      if (unmounted || !win.google?.accounts?.id || !clientId) return
      try {
        win.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
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
              onNotify(labels.googleSuccess || 'Вход через Google успешен!')
              onNavigate('profile')
            } catch (err: unknown) {
              onNotify(err instanceof Error ? err.message : 'Ошибка авторизации Google')
            } finally {
              setLoading(false)
            }
          },
        })

        if (gsiContainerRef.current) {
          gsiContainerRef.current.innerHTML = ''
          win.google.accounts.id.renderButton(gsiContainerRef.current, {
            type: 'icon',
            shape: 'circle',
            theme: 'outline',
            size: 'large',
          })
        }
      } catch (e) {
        console.warn('GSI init error:', e)
      }
    }

    if (win.google?.accounts?.id) {
      initGsi()
    } else {
      const interval = setInterval(() => {
        if (win.google?.accounts?.id) {
          clearInterval(interval)
          initGsi()
        }
      }, 250)
      return () => {
        unmounted = true
        clearInterval(interval)
      }
    }

    return () => {
      unmounted = true
    }
  }, [ageGroup, labels.googleSuccess, onNavigate, onNotify, onSuccess])

  const handleClick = () => {
    const win = window as any
    if (win.google?.accounts?.id) {
      win.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          const innerBtn = gsiContainerRef.current?.querySelector('div[role="button"]') as HTMLElement
          if (innerBtn) innerBtn.click()
        }
      })
      const innerBtn = gsiContainerRef.current?.querySelector('div[role="button"]') as HTMLElement
      if (innerBtn) innerBtn.click()
    } else {
      onNotify('Сервис Google загружается... Попробуйте через секунду')
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`relative w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 overflow-hidden ${
        disabled || loading ? 'opacity-50 pointer-events-none' : ''
      }`}
      aria-label="Sign in with Google"
      title="Sign in with Google"
    >
      <GoogleIcon className="w-5 h-5 pointer-events-none z-10" />

      {/* Invisible overlay of Google's rendered circular button directly under cursor */}
      <div
        ref={gsiContainerRef}
        className="absolute inset-0 opacity-0 overflow-hidden flex items-center justify-center cursor-pointer z-20 scale-125"
      />

      {loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-800/70 flex items-center justify-center z-30">
          <span className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   MAIN AUTH PAGE COMPONENT
   ========================================================================== */

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot-password' | 'reset-password'
  initialToken?: string | null
  lang: Language
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string) => void
  onNavigate: (pageId: string) => void
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialToken,
  lang,
  onSuccess,
  onNotify,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>(
    initialToken ? 'reset-password' : initialMode
  )
  const [authMethod, setAuthMethod] = useState<'email' | 'mobile'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [ageGroup, setAgeGroup] = useState('18_plus')
  const [resetToken, setResetToken] = useState<string>(() => {
    if (initialToken) return initialToken
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      return p.get('token') || ''
    }
    return ''
  })
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  // Hero Slider State (Dots on left frosted glass card)
  const [activeSlide, setActiveSlide] = useState(0)

  // Auto-switch banner cards every 5 seconds with smooth fade transition
  useEffect(() => {
    const count = 4 // Total slider cards per locale
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % count)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (initialToken) {
      setResetToken(initialToken)
      setMode('reset-password')
    } else {
      setMode(initialMode)
    }
  }, [initialMode, initialToken])

  const t = {
    ru: {
      loginTitle: 'Войдите в аккаунт!',
      loginSubtitle: 'Добро пожаловать в доказательную цифровую медицину SIHAT.',
      registerTitle: 'Создайте аккаунт!',
      registerSubtitle: 'Приватное пространство для контроля и скрининга функций здоровья.',
      forgotTitle: 'Восстановление пароля',
      forgotSubtitle: 'Введите email для получения ссылки сброса доступа.',
      resetTitle: 'Новый пароль',
      resetSubtitle: 'Введите полученный токен и новый безопасный пароль.',
      tabEmail: 'E-mail',
      tabMobile: 'Номер телефона',
      emailPlaceholder: 'Email (например: name@example.com)',
      phonePlaceholder: 'Номер телефона (например: +992 90 000 0000)',
      passwordPlaceholder: 'Пароль (минимум 8 символов)',
      fullNamePlaceholder: 'Ваше имя или псевдоним',
      continueBtn: 'Продолжить',
      registerBtn: 'Зарегистрироваться',
      signInWith: 'Войти через',
      noAccount: 'Еще нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
      signUpLink: 'Зарегистрироваться',
      loginLink: 'Войти',
      forgotPassLink: 'Забыли пароль?',
      backToHome: 'На главную',
      backToLogin: 'Вернуться ко входу',
      sendResetBtn: 'Отправить ссылку для сброса',
      setNewPasswordBtn: 'Сохранить новый пароль',
      resetSentMsg: 'Инструкция для сброса пароля отправлена на указанную почту.',
      resetSuccessMsg: 'Пароль успешно обновлен. Теперь вы можете войти.',
      sliderCards: [
        { title: 'Добро пожаловать в SIHAT', desc: 'Единая платформа скрининга и доказательной медицины' },
        { title: 'Научная калибровка ISO 8596', desc: 'Высокоточная проверка остроты зрения и контрастности' },
        { title: 'Аудиометрия и Струп-тест', desc: 'Оценка частотного порога слуха и когнитивного контроля' },
        { title: 'Строгая приватность данных', desc: 'Zero-Retention архитектура без передачи биометрии третьим лицам' },
      ],
    },
    tj: {
      loginTitle: 'Ба ҳисоби худ ворид шавед!',
      loginSubtitle: 'Ба платформаи ташхис ва тибби исботшудаи SIHAT хуш омадед.',
      registerTitle: 'Ҳисоби нав эҷод кунед!',
      registerSubtitle: 'Муҳити амн ва маҳрамона барои назорати саломатии шумо.',
      forgotTitle: 'Барқароркунии рамз',
      forgotSubtitle: 'Почтаи электрониро барои гирифтани пайванд ворид намоед.',
      resetTitle: 'Рамзи нав',
      resetSubtitle: 'Токени гирифташуда ва рамзи навро ворид кунед.',
      tabEmail: 'E-mail',
      tabMobile: 'Рақами телефон',
      emailPlaceholder: 'Email (масалан: name@example.com)',
      phonePlaceholder: 'Рақами телефон (масалан: +992 90 000 0000)',
      passwordPlaceholder: 'Рамз (ҳадди ақал 8 аломат)',
      fullNamePlaceholder: 'Ному насаби шумо',
      continueBtn: 'Идома додан',
      registerBtn: 'Бақайдгирӣ',
      signInWith: 'Воридшавӣ тавассути',
      noAccount: 'Ҳанӯз ҳисоб надоред?',
      hasAccount: 'Аллакай ҳисоб доред?',
      signUpLink: 'Бақайдгирӣ',
      loginLink: 'Воридшавӣ',
      forgotPassLink: 'Рамзро фаромӯш кардед?',
      backToHome: 'Ба саҳифаи асосӣ',
      backToLogin: 'Бозгашт ба воридшавӣ',
      sendResetBtn: 'Ирсоли пайванд',
      setNewPasswordBtn: 'Сабти рамзи нав',
      resetSentMsg: 'Дастурамали барқароркунӣ фиристода шуд.',
      resetSuccessMsg: 'Рамз нав шуд. Акнун ворид шавед.',
      sliderCards: [
        { title: 'Ба ҷомеаи SIHAT хуш омадед', desc: 'Платформаи ягонаи скрининг ва назорати саломатӣ' },
        { title: 'Калибровкаи стандартии ISO 8596', desc: 'Санҷиши дақиқи биноӣ ва ҳассосияти контраст' },
        { title: 'Аудиометрия ва тести Струп', desc: 'Санҷиши шунавоӣ ва диққати когнитивӣ' },
        { title: 'Махфияти пурраи маълумот', desc: 'Ҳифзи пурраи маълумоти тиббии шумо' },
      ],
    },
    en: {
      loginTitle: 'Login your account!',
      loginSubtitle: 'Welcome to evidence-based sensory screening and health insights.',
      registerTitle: 'Create your account!',
      registerSubtitle: 'Confidential space to track cognitive and sensory markers.',
      forgotTitle: 'Reset Password',
      forgotSubtitle: 'Enter your email to receive recovery instructions.',
      resetTitle: 'New Password',
      resetSubtitle: 'Enter the recovery token and choose a new password.',
      tabEmail: 'E-mail',
      tabMobile: 'Mobile number',
      emailPlaceholder: 'Email address',
      phonePlaceholder: 'Mobile number (e.g. +1 555 019 283)',
      passwordPlaceholder: 'Password (min. 8 characters)',
      fullNamePlaceholder: 'Your full name',
      continueBtn: 'Continue',
      registerBtn: 'Sign Up',
      signInWith: 'Sign in with',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signUpLink: 'Sign up',
      loginLink: 'Log in',
      forgotPassLink: 'Forgot password?',
      backToHome: 'Back to Home',
      backToLogin: 'Back to Sign In',
      sendResetBtn: 'Send Reset Link',
      setNewPasswordBtn: 'Save New Password',
      resetSentMsg: 'Password reset instructions have been dispatched.',
      resetSuccessMsg: 'Password updated successfully. You can now sign in.',
      sliderCards: [
        { title: 'Welcome to the Community', desc: 'Login to explore exclusive health insights' },
        { title: 'ISO 8596 Clinical Calibration', desc: 'Precision sensory vision & contrast metrics' },
        { title: 'Pure Audiometry & Stroop Test', desc: 'Validated frequency hearing & executive focus' },
        { title: 'Zero-Retention Privacy', desc: 'End-to-end encrypted local health evaluation' },
      ],
    },
  }[lang]

  /* Form Submission Handlers */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const isMobile = authMethod === 'mobile'
    const identifier = isMobile ? phone.trim() : email.trim()
    if (!identifier || !password) return
    setLoading(true)
    try {
      const payload = isMobile ? { phone: identifier, password } : { email: identifier, password }
      const data = await apiRequest<{
        access_token: string
        refresh_token: string
        user: UserProfile
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
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
    const isMobile = authMethod === 'mobile'
    const identifier = isMobile ? phone.trim() : email.trim()
    if (!identifier || !password || !fullName) return
    setLoading(true)
    try {
      const regPayload = isMobile
        ? {
            phone: identifier,
            password,
            full_name: fullName.trim(),
            age_group: ageGroup,
          }
        : {
            email: identifier,
            password,
            full_name: fullName.trim(),
            age_group: ageGroup,
          }

      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(regPayload),
      })

      // Auto login after registration
      const loginPayload = isMobile ? { phone: identifier, password } : { email: identifier, password }
      const data = await apiRequest<{
        access_token: string
        refresh_token: string
        user: UserProfile
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginPayload),
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

  const currentSlide = t.sliderCards[activeSlide] || t.sliderCards[0]

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6">
      {/* MASTER AUTHENTICATION CARD (Figma Pixel-Perfect Replica) */}
      <main
        role="main"
        className="w-full max-w-[960px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-2 overflow-hidden transition-all duration-300 relative"
      >
        {/* ==========================================================================
            1. LEFT HERO PANEL (3D Minimalist Graphic + Glassmorphism Card)
            ========================================================================== */}
        <section
          className="relative bg-gradient-to-br from-slate-900 via-slate-850 to-zinc-950 p-6 sm:p-9 min-h-[320px] lg:min-h-[620px] flex flex-col justify-end overflow-hidden group"
          aria-label="Welcome Visual Presentation"
        >
          {/* Futuristic 3D Architecture Visual */}
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            alt="Futuristic 3D sphere and architecture"
            className="absolute inset-0 w-full h-full object-cover object-center filter contrast-105 brightness-95 transition-transform duration-1000 group-hover:scale-105 pointer-events-none"
          />

          {/* Ambient Cyan / Neon Studio Glow */}
          <div
            className="absolute -top-12 -right-12 w-80 h-80 bg-sky-400/30 dark:bg-emerald-400/25 blur-3xl pointer-events-none mix-blend-screen"
            aria-hidden="true"
          />

          {/* Top Brand Tag inside visual banner */}
          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wider uppercase">
            <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
            <span>SIHAT • Clarity</span>
          </div>

          {/* Overlaid Frosted Glass Card with Smooth Auto-Fade Slider */}
          <div className="relative z-10 bg-white/20 dark:bg-black/35 backdrop-blur-xl border border-white/35 dark:border-white/15 rounded-2xl p-5 sm:p-6 text-center text-white shadow-2xl transition-all">
            <div className="min-h-[76px] sm:min-h-[82px] flex flex-col justify-center mb-3 overflow-hidden">
              <div
                key={activeSlide}
                className="animate-in fade-in zoom-in-95 duration-500 ease-out"
              >
                <h2 className="text-base sm:text-lg font-bold tracking-tight mb-1 text-white drop-shadow-sm line-clamp-1">
                  {currentSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium line-clamp-2">
                  {currentSlide.desc}
                </p>
              </div>
            </div>

            {/* Slider Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5" role="tablist" aria-label="Slide indicators">
              {t.sliderCards.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 transition-all duration-500 rounded-full cursor-pointer ${
                    activeSlide === idx
                      ? 'w-6 bg-white shadow-md shadow-white/60'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                  aria-selected={activeSlide === idx}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ==========================================================================
            2. RIGHT AUTHENTICATION FORM PANEL
            ========================================================================== */}
        <section
          className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white dark:bg-zinc-900"
          aria-label="Authentication Form"
        >
          {/* Top Breadcrumb & Back to Home */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToHome}</span>
            </button>

            {/* Sub-mode tag */}
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
              {mode === 'register' ? 'Sign Up' : mode === 'login' ? 'Sign In' : 'Account Recovery'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight text-center mb-1">
            {mode === 'register'
              ? t.registerTitle
              : mode === 'forgot-password'
              ? t.forgotTitle
              : mode === 'reset-password'
              ? t.resetTitle
              : t.loginTitle}
          </h1>

          <p className="text-xs text-slate-500 dark:text-zinc-400 text-center mb-6 leading-relaxed">
            {mode === 'register'
              ? t.registerSubtitle
              : mode === 'forgot-password'
              ? t.forgotSubtitle
              : mode === 'reset-password'
              ? t.resetSubtitle
              : t.loginSubtitle}
          </p>

          {/* Method Switcher Tabs (E-mail vs Mobile number) - Available for Login & Register */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex items-center justify-center gap-8 mb-6 border-b border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                  authMethod === 'email'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
              >
                <span>{t.tabEmail}</span>
                {authMethod === 'email' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-sky-500 dark:bg-sky-400 rounded-full shadow-sm shadow-sky-500/50" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('mobile')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                  authMethod === 'mobile'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-300'
                }`}
              >
                <span>{t.tabMobile}</span>
                {authMethod === 'mobile' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-sky-500 dark:bg-sky-400 rounded-full shadow-sm shadow-sky-500/50" />
                )}
              </button>
            </div>
          )}

          {/* ==========================================================================
              FORM 1 & 2: LOGIN OR REGISTER
              ========================================================================== */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
              {/* Full Name Field (Register Mode Only) */}
              {mode === 'register' && (
                <div>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Email or Phone Input Field */}
              {authMethod === 'email' ? (
                <div>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t.phonePlaceholder}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link (Login Mode Only) */}
              {mode === 'login' && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setMode('forgot-password')}
                    className="text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-zinc-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    {t.forgotPassLink}
                  </button>
                </div>
              )}

              {/* Age Group Selector (Register Mode Only) */}
              {mode === 'register' && (
                <div className="pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAgeGroup('18_plus')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                        ageGroup === '18_plus'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      18+ (Взрослый контур)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgeGroup('16_17')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                        ageGroup === '16_17'
                          ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      16–17 (Юношеский)
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Vibrant Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : mode === 'register' ? (
                  t.registerBtn
                ) : (
                  t.continueBtn
                )}
              </button>
            </form>
          )}

          {/* ==========================================================================
              FORM 3: FORGOT PASSWORD
              ========================================================================== */}
          {mode === 'forgot-password' && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-3">
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
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    {loading ? '...' : t.sendResetBtn}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  ← {t.backToLogin}
                </button>
              </div>
            </div>
          )}

          {/* ==========================================================================
              FORM 4: RESET PASSWORD
              ========================================================================== */}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative flex items-center">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Токен сброса из письма"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Новый пароль"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-sky-500 focus:ring-3 focus:ring-sky-500/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                {loading ? '...' : t.setNewPasswordBtn}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  ← {t.backToLogin}
                </button>
              </div>
            </form>
          )}

          {/* ==========================================================================
              SOCIAL SIGN-IN SECTION (Figma Circular Buttons Row)
              ========================================================================== */}
          {(mode === 'login' || mode === 'register') && (
            <>
              {/* Divider */}
              <div className="relative text-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                </div>
                <span className="relative px-3 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t.signInWith}
                </span>
              </div>

              {/* Social Buttons Row (Facebook, Google, Apple) */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {/* Facebook */}
                <button
                  type="button"
                  onClick={() => onNotify('Авторизация через Facebook скоро будет доступна')}
                  className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                  aria-label="Sign in with Facebook"
                  title="Sign in with Facebook"
                >
                  <FacebookIcon className="w-5 h-5" />
                </button>

                {/* Google with Official GSI */}
                <GoogleAuthButton
                  mode={mode as 'login' | 'register'}
                  ageGroup={ageGroup}
                  lang={lang}
                  labels={t as any}
                  onSuccess={onSuccess}
                  onNotify={onNotify}
                  onNavigate={onNavigate}
                  disabled={loading}
                />

                {/* Apple */}
                <button
                  type="button"
                  onClick={() => onNotify('Авторизация через Apple скоро будет доступна')}
                  className="w-11 h-11 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white flex items-center justify-center cursor-pointer transition-all hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
                  aria-label="Sign in with Apple"
                  title="Sign in with Apple"
                >
                  <AppleIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Footer Switcher (Login <-> Sign Up) */}
              <footer className="text-center text-xs text-slate-500 dark:text-zinc-400">
                <span>{mode === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  {mode === 'register' ? t.loginLink : t.signUpLink}
                </button>
              </footer>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
