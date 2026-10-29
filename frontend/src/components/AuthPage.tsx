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
  labels: Record<string, string>
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
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
    let clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '26582096896-d1k7bij57g2cekc2k7u41pba24gdp4t1.apps.googleusercontent.com'
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
              onNotify(labels.googleSuccess || 'Вход через Google выполнен успешно!', 'success')
              onNavigate('profile')
            } catch (err: unknown) {
              onNotify(err instanceof Error ? err.message : 'Ошибка авторизации Google', 'error')
            } finally {
              setLoading(false)
            }
          },
        })

        if (gsiContainerRef.current) {
          gsiContainerRef.current.innerHTML = ''
          win.google.accounts.id.renderButton(gsiContainerRef.current, {
            type: 'standard',
            shape: 'pill',
            theme: 'outline',
            size: 'large',
            width: 300,
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
      onNotify('Сервис Google загружается, попробуйте через секунду', 'info')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`relative w-full py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-zinc-200 cursor-pointer transition-all hover:bg-white dark:hover:bg-zinc-700 hover:border-emerald-500/50 shadow-xs overflow-hidden ${
        disabled || loading ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <GoogleIcon className="w-4 h-4 pointer-events-none z-10" />
      <span className="pointer-events-none z-10">Google</span>
      <div
        ref={gsiContainerRef}
        className="absolute inset-0 opacity-0 overflow-hidden flex items-center justify-center cursor-pointer z-20"
      />
      {loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-800/70 flex items-center justify-center z-30">
          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  )
}

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot-password' | 'reset-password'
  initialToken?: string | null
  lang: Language
  onSuccess: (user: UserProfile, token: string) => void
  onNotify: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void
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
  const [formError, setFormError] = useState<string | null>(null)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 4)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setFormError(null)
    if (initialToken) {
      setResetToken(initialToken)
      setMode('reset-password')
    } else {
      setMode(initialMode)
    }
  }, [initialMode, initialToken])

  const switchMode = (nextMode: 'login' | 'register' | 'forgot-password' | 'reset-password') => {
    setFormError(null)
    setMode(nextMode)
    onNavigate(nextMode)
  }

  const t = {
    ru: {
      loginTitle: 'Вход в аккаунт',
      loginSubtitle: 'Войдите, чтобы сохранять результаты скринингов и сравнивать динамику.',
      registerTitle: 'Регистрация аккаунта',
      registerSubtitle: 'Создайте личный архив для сохранения и сравнения результатов.',
      forgotTitle: 'Восстановление пароля',
      forgotSubtitle: 'Введите email вашего аккаунта для получения ссылки сброса.',
      resetTitle: 'Установка нового пароля',
      resetSubtitle: 'Введите код/токен восстановления и задайте новый пароль.',
      tabEmail: 'E-mail',
      tabMobile: 'Номер телефона',
      emailPlaceholder: 'Email (например: name@example.com)',
      phonePlaceholder: 'Номер телефона (например: +992 90 000 0000)',
      passwordPlaceholder: 'Пароль (минимум 8 символов)',
      fullNamePlaceholder: 'Ваше имя',
      continueBtn: 'Войти',
      registerBtn: 'Создать аккаунт',
      signInWith: 'Или продолжить через',
      noAccount: 'Ещё нет аккаунта?',
      hasAccount: 'Уже есть аккаунт?',
      signUpLink: 'Зарегистрироваться',
      loginLink: 'Войти',
      forgotPassLink: 'Забыли пароль?',
      backToHome: 'На главную',
      backToLogin: 'Вернуться ко входу',
      sendResetBtn: 'Отправить ссылку для сброса',
      setNewPasswordBtn: 'Сохранить новый пароль',
      resetSentMsg: 'Инструкция для сброса пароля отправлена на указанную почту.',
      resetSuccessMsg: 'Пароль успешно обновлён. Теперь вы можете войти.',
      googleSuccess: 'Вход через Google выполнен!',
      sliderCards: [
        { title: 'Добро пожаловать в SIHAT', desc: 'Интерактивная платформа когнитивного и сенсорного скрининга' },
        { title: '15 интерактивных методик', desc: 'Таблицы Шульте, Блоки Корси, Решётки Габора и реакция' },
        { title: 'Открытые паспорта методик', desc: 'Научные первоисточники, правила подсчёта и ограничения' },
        { title: 'Контроль приватности', desc: 'Сохранение результатов только с вашего явного согласия' },
      ],
    },
    tj: {
      loginTitle: 'Воридшавӣ ба ҳисоб',
      loginSubtitle: 'Барои нигоҳ доштани натиҷаҳо ва муқоисаи динамика ворид шавед.',
      registerTitle: 'Бақайдгирии ҳисоб',
      registerSubtitle: 'Бойгонии шахсиро барои нигоҳдории натиҷаҳо эҷод кунед.',
      forgotTitle: 'Барқароркунии рамз',
      forgotSubtitle: 'Почтаи электрониро барои гирифтани пайванди барқароркунӣ ворид намоед.',
      resetTitle: 'Рамзи нав',
      resetSubtitle: 'Токени гирифташуда ва рамзи навро ворид кунед.',
      tabEmail: 'E-mail',
      tabMobile: 'Рақами телефон',
      emailPlaceholder: 'Email (масалан: name@example.com)',
      phonePlaceholder: 'Рақами телефон (масалан: +992 90 000 0000)',
      passwordPlaceholder: 'Рамз (ҳадди ақал 8 аломат)',
      fullNamePlaceholder: 'Ному насаби шумо',
      continueBtn: 'Ворид шудан',
      registerBtn: 'Эҷоди ҳисоб',
      signInWith: 'Ё идома додан тавассути',
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
      googleSuccess: 'Воридшавӣ тавассути Google анҷом ёфт!',
      sliderCards: [
        { title: 'Ба SIHAT хуш омадед', desc: 'Платформаи интерактивии скрининги маърифатӣ ва сенсорӣ' },
        { title: '15 методикаи интерактивӣ', desc: 'Ҷадвалҳои Шулте, Блокҳои Корси, Контраст ва вокуниш' },
        { title: 'Шиносномаҳои кушодаи методӣ', desc: 'Сарчашмаҳои илмӣ, қоидаҳои ҳисоб ва маҳдудиятҳо' },
        { title: 'Назорати махфият', desc: 'Нигоҳдории натиҷаҳо танҳо бо розигии шумо' },
      ],
    },
    en: {
      loginTitle: 'Sign In to Account',
      loginSubtitle: 'Sign in to save your screening results and compare longitudinal progress.',
      registerTitle: 'Create an Account',
      registerSubtitle: 'Create a private vault to store and compare your results.',
      forgotTitle: 'Reset Password',
      forgotSubtitle: 'Enter your account email to receive recovery instructions.',
      resetTitle: 'Set New Password',
      resetSubtitle: 'Enter the recovery token and choose a new password.',
      tabEmail: 'E-mail',
      tabMobile: 'Mobile number',
      emailPlaceholder: 'Email address',
      phonePlaceholder: 'Mobile number (e.g. +992 90 000 0000)',
      passwordPlaceholder: 'Password (min. 8 characters)',
      fullNamePlaceholder: 'Your full name',
      continueBtn: 'Sign In',
      registerBtn: 'Create Account',
      signInWith: 'Or continue with',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signUpLink: 'Sign up',
      loginLink: 'Sign in',
      forgotPassLink: 'Forgot password?',
      backToHome: 'Back to Home',
      backToLogin: 'Back to Sign In',
      sendResetBtn: 'Send Reset Link',
      setNewPasswordBtn: 'Save New Password',
      resetSentMsg: 'Password reset instructions have been sent.',
      resetSuccessMsg: 'Password updated successfully. You can now sign in.',
      googleSuccess: 'Signed in with Google!',
      sliderCards: [
        { title: 'Welcome to SIHAT', desc: 'Interactive cognitive and sensory self-screening platform' },
        { title: '15 Interactive Exercises', desc: 'Schulte Tables, Corsi Blocks, Gabor Contrast & Reaction' },
        { title: 'Transparent Passports', desc: 'Scientific sources, scoring formulas, and honest limitations' },
        { title: 'Privacy First', desc: 'Results are saved only with your explicit consent' },
      ],
    },
  }[lang]

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
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
      onNotify('Вход успешно выполнен!', 'success')
      onNavigate('profile')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка авторизации'
      setFormError(msg)
      onNotify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const isMobile = authMethod === 'mobile'
    const identifier = isMobile ? phone.trim() : email.trim()
    if (!identifier || !password || !fullName.trim()) return
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
      onNotify('Аккаунт успешно создан!', 'success')
      onNavigate('profile')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка регистрации'
      setFormError(msg)
      onNotify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!email.trim()) return
    setLoading(true)
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setForgotSent(true)
      onNotify(t.resetSentMsg, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки запроса'
      setFormError(msg)
      onNotify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!resetToken.trim() || !newPassword) return
    setLoading(true)
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: resetToken.trim(), new_password: newPassword }),
      })
      onNotify(t.resetSuccessMsg, 'success')
      switchMode('login')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Неверный или просроченный токен'
      setFormError(msg)
      onNotify(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const currentSlide = t.sliderCards[activeSlide] || t.sliderCards[0]

  return (
    <div className="min-h-[88vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <main
        role="main"
        className="w-full max-w-[960px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-2 overflow-hidden transition-all duration-300 relative"
      >
        {/* LEFT HERO PANEL */}
        <section
          className="relative bg-gradient-to-br from-[#0B2923] via-[#103D35] to-zinc-950 p-6 sm:p-9 min-h-[280px] lg:min-h-[600px] flex flex-col justify-end overflow-hidden group"
          aria-label="SIHAT Presentation"
        >
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            alt="SIHAT Background"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-55 filter contrast-105 brightness-90 transition-transform duration-1000 group-hover:scale-105 pointer-events-none"
          />
          <div
            className="absolute -top-12 -right-12 w-80 h-80 bg-emerald-400/25 blur-3xl pointer-events-none mix-blend-screen"
            aria-hidden="true"
          />

          <div className="absolute top-6 left-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-wider uppercase">
            <HeartPulse className="w-3.5 h-3.5 text-[#2EC4A7]" />
            <span>SIHAT • Health Clarity</span>
          </div>

          <div className="relative z-10 bg-black/35 backdrop-blur-xl border border-white/20 rounded-2xl p-5 sm:p-6 text-center text-white shadow-2xl transition-all">
            <div className="min-h-[76px] flex flex-col justify-center mb-3 overflow-hidden">
              <div key={activeSlide} className="animate-in fade-in zoom-in-95 duration-500 ease-out">
                <h2 className="text-base sm:text-lg font-bold tracking-tight mb-1 text-white drop-shadow-sm">
                  {currentSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/85 leading-relaxed font-medium">
                  {currentSlide.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5" role="tablist">
              {t.sliderCards.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlide(idx)}
                  className={`h-2 transition-all duration-500 rounded-full cursor-pointer ${
                    activeSlide === idx ? 'w-6 bg-[#2EC4A7]' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT FORM PANEL */}
        <section className="p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#17A884] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backToHome}</span>
            </button>

            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[#17A884] dark:text-[#2EC4A7]">
              {mode === 'register' ? 'Sign Up' : mode === 'login' ? 'Sign In' : 'Recovery'}
            </span>
          </div>

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

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div className="flex items-center justify-center gap-8 mb-6 border-b border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setAuthMethod('email')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                  authMethod === 'email'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700'
                }`}
              >
                <span>{t.tabEmail}</span>
                {authMethod === 'email' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#17A884] rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('mobile')}
                className={`pb-2.5 text-xs sm:text-sm font-semibold transition-all relative cursor-pointer ${
                  authMethod === 'mobile'
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-700'
                }`}
              >
                <span>{t.tabMobile}</span>
                {authMethod === 'mobile' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#17A884] rounded-full" />
                )}
              </button>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
              {mode === 'register' && (
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.fullNamePlaceholder}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
                  />
                </div>
              )}

              {authMethod === 'email' ? (
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
                  />
                </div>
              ) : (
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phonePlaceholder}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
                  />
                </div>
              )}

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
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

              {mode === 'login' && (
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs font-semibold text-slate-500 hover:text-[#17A884] transition-colors cursor-pointer"
                  >
                    {t.forgotPassLink}
                  </button>
                </div>
              )}

              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAgeGroup('18_plus')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      ageGroup === '18_plus'
                        ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    18+ (Взрослый)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgeGroup('16_17')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      ageGroup === '16_17'
                        ? 'border-[#17A884] bg-[#17A884]/10 text-[#103D35] dark:text-[#2EC4A7]'
                        : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                    }`}
                  >
                    16–17 (Юношеский)
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] hover:from-[#13493f] hover:to-[#1ab891] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#17A884]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
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

          {mode === 'forgot-password' && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">{t.resetSentMsg}</p>
                    <button
                      type="button"
                      onClick={() => switchMode('reset-password')}
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {loading ? '...' : t.sendResetBtn}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-semibold text-[#17A884] hover:underline cursor-pointer"
                >
                  ← {t.backToLogin}
                </button>
              </div>
            </div>
          )}

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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
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
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-[#17A884] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#103D35] to-[#17A884] text-white font-bold text-sm shadow-md transition-all cursor-pointer"
              >
                {loading ? '...' : t.setNewPasswordBtn}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-xs font-semibold text-[#17A884] hover:underline cursor-pointer"
                >
                  ← {t.backToLogin}
                </button>
              </div>
            </form>
          )}

          {(mode === 'login' || mode === 'register') && (
            <>
              <div className="relative text-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                </div>
                <span className="relative px-3 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  {t.signInWith}
                </span>
              </div>

              <div className="mb-6">
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
              </div>

              <footer className="text-center text-xs text-slate-500 dark:text-zinc-400">
                <span>{mode === 'register' ? t.hasAccount : t.noAccount}</span>{' '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'register' ? 'login' : 'register')}
                  className="font-bold text-[#17A884] dark:text-[#2EC4A7] hover:underline cursor-pointer"
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
