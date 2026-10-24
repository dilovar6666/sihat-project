import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { Button } from './ui/Button'
import { apiRequest, setApiToken, setRefreshToken } from '../api'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

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
      googleBtn: 'Войти через Google',
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
      googleBtn: 'Воридшавӣ бо Google',
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
