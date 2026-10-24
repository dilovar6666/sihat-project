import React, { useEffect } from 'react'
import {
  X,
  User,
  History,
  Sparkles,
  Headphones,
  ShieldAlert,
  LogOut,
  LogIn,
  ChevronRight,
  ShieldCheck,
  Compass,
  FileQuestion,
  Home,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { Button } from './ui/Button'
import { UserAvatar } from './UserAvatar'
import type { Language } from '../i18n'
import type { UserProfile } from '../types'

interface ProfileDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  lang: Language
  onOpenAuth: () => void
  onLogout: () => void
  onNavigate: (sectionId: string) => void
  onOpenAssistant: () => void
  currentSection: string
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  lang,
  onOpenAuth,
  onLogout,
  onNavigate,
  onOpenAssistant,
  currentSection,
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleAction = (callback: () => void) => {
    callback()
    onClose()
  }

  // Localized texts
  const t = {
    title: lang === 'tj' ? 'Ҳисоб ва хадамот' : lang === 'en' ? 'Profile & Services' : 'Личный кабинет и сервисы',
    guestTitle: lang === 'tj' ? 'Ҳолати меҳмон' : lang === 'en' ? 'Guest Mode' : 'Гостевой сеанс',
    guestSubtitle: lang === 'tj'
      ? 'Барои нигоҳдории таърих ва таҳияи шиносномаҳои PDF ворид шавед'
      : lang === 'en'
      ? 'Sign in to save screening history and export clinical PDF reports'
      : 'Войдите для сохранения личной истории и экспорта клинических PDF-паспортов',
    signInBtn: lang === 'tj' ? 'Воридшавӣ / Қайдгирӣ' : lang === 'en' ? 'Sign In / Register' : 'Войти или зарегистрироваться',
    servicesHeading: lang === 'tj' ? 'ХАДАМОТИ ИХТИСОСӢ' : lang === 'en' ? 'SPECIALIZED SERVICES' : 'СПЕЦИАЛИЗИРОВАННЫЕ СЕРВИСЫ',
    navHeading: lang === 'tj' ? 'БАХШҲОИ АСОСӢ' : lang === 'en' ? 'CORE NAVIGATION' : 'ОСНОВНЫЕ РАЗДЕЛЫ',
    historyTitle: lang === 'tj' ? 'Таърихи натиҷаҳо' : lang === 'en' ? 'Screening History & PDF' : 'История результатов',
    historySub: lang === 'tj' ? 'Осорхонаи пӯшида, санҷишҳои гузашта ва PDF' : lang === 'en' ? 'Private archive, test dynamics & PDF export' : 'Личный закрытый архив, динамика и PDF-паспорта',
    assistantTitle: lang === 'tj' ? 'Ёвари клиникии AI' : lang === 'en' ? 'Clinical AI Guide (Gemini)' : 'ИИ-помощник (Gemini)',
    assistantSub: lang === 'tj' ? 'Роҳнамои интеллектуалӣ ва тавзеҳи усулҳо' : lang === 'en' ? 'Intelligent symptom navigator & methodology guide' : 'Клинический разбор симптомов, калибровка и навигация',
    supportTitle: lang === 'tj' ? 'Дастгирӣ ва алоқа' : lang === 'en' ? 'Support & Helpdesk' : 'Служба поддержки',
    supportSub: lang === 'tj' ? 'Духтури навбатдор ва фикру мулоҳизаҳо' : lang === 'en' ? 'Duty clinician, calibration queries & feedback' : 'Связь с модераторами, вопросы калибровки и помощь',
    adminTitle: lang === 'tj' ? 'Маъмурият (Tremor Dashboard)' : lang === 'en' ? 'Admin Panel (Tremor)' : 'Админ-панель (Tremor)',
    adminSub: lang === 'tj' ? 'Uptime-и хадамот, амният ва феҳристи тестҳо' : lang === 'en' ? 'Tremor Overview: Uptime telemetry & tests management' : 'Uptime сервисов, аудит приватности и тесты',
    homeTitle: lang === 'tj' ? 'Асосӣ' : lang === 'en' ? 'Home' : 'Главная',
    catalogTitle: lang === 'tj' ? 'Феҳристи 15 тест' : lang === 'en' ? 'Catalog (15 Screenings)' : 'Каталог (15 тестов)',
    passportTitle: lang === 'tj' ? 'Шиносномаҳои методӣ' : lang === 'en' ? 'Methodology Passports' : 'Паспорта методик',
    faqTitle: lang === 'tj' ? 'Пойгоҳи дониш ва Саволҳо' : lang === 'en' ? 'Knowledge Base & FAQ' : 'База знаний и FAQ',
    privacyBadge: lang === 'tj' ? 'Протоколи Zero-Retention фаъол аст' : lang === 'en' ? 'Zero-Retention Privacy Active' : 'Протокол Zero-Retention активен',
    privacyText: lang === 'tj'
      ? 'Маълумоти ҳассос дар сервер бе розигии шумо захира намешавад ва дар дастгоҳи шумо шифргузорӣ мегардад.'
      : lang === 'en'
      ? 'Clinical responses are processed locally on your device and are never sold or retained without consent.'
      : 'Сенсорные ответы обрабатываются локально на вашем устройстве и безвозвратно удаляются по первому требованию.',
    signOutBtn: lang === 'tj' ? 'Баромадан аз ҳисоб' : lang === 'en' ? 'Sign Out' : 'Выйти из аккаунта',
    verifiedUser: lang === 'tj' ? 'Истифодабарандаи тасдиқшуда' : lang === 'en' ? 'Verified Account' : 'Верифицированный профиль',
    adminBadge: lang === 'tj' ? 'Мудири Tremor' : lang === 'en' ? 'Administrator' : 'Администратор (Tremor Ops)',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md liquid-glass border-l border-white/20 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.title}</h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">SIHAT Clarity HealthTech</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* User Profile Card */}
          {user ? (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 space-y-3">
              <div className="flex items-center gap-3">
                <UserAvatar user={user} size="md" showBadge />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {user.full_name || user.email.split('@')[0]}
                    </span>
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <ShieldAlert className="w-3 h-3" />
                        {t.adminBadge}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {t.verifiedUser}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold justify-between border-emerald-500/30 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                onClick={() => handleAction(() => onNavigate('profile'))}
              >
                <span>{lang === 'tj' ? 'Саҳифаи профил ва танзимот' : lang === 'en' ? 'Open Profile & Settings' : 'Открыть страницу профиля'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.guestTitle}</h3>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Скрининги доступны без регистрации
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3 leading-relaxed">
                {t.guestSubtitle}
              </p>
              <Button
                variant="default"
                size="sm"
                className="w-full gap-2 shadow-md shadow-emerald-600/20"
                onClick={() => handleAction(onOpenAuth)}
              >
                <LogIn className="w-4 h-4" />
                <span>{t.signInBtn}</span>
              </Button>
            </div>
          )}

          {/* Primary Services (Items moved from floating Navbar) */}
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              {t.servicesHeading}
            </div>

            {/* 0. Личная страница профиля */}
            <button
              onClick={() => handleAction(() => onNavigate('profile'))}
              className={`w-full group p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                currentSection === 'profile'
                  ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{lang === 'tj' ? 'Саҳифаи профил' : lang === 'en' ? 'My Profile' : 'Мой профиль'}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      NEW
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {lang === 'tj' ? 'Аватарҳо, таҳрир ва натиҷаҳо' : lang === 'en' ? 'Avatars, edit info & all results' : 'Аватарка, редактирование и результаты'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </button>

            {/* 1. История результатов */}
            <button
              onClick={() => handleAction(() => onNavigate('history'))}
              className={`w-full group p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                currentSection === 'history'
                  ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{t.historyTitle}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{t.historySub}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </button>

            {/* 2. ИИ-помощник (Gemini) */}
            <div
              className={`w-full group p-3 rounded-2xl border transition-all ${
                currentSection === 'assistant'
                  ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleAction(() => onNavigate('assistant'))}
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500/15 to-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{t.assistantTitle}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        2.5 Flash
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{t.assistantSub}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleAction(onOpenAssistant)}
                    className="px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 text-[10px] font-bold border border-emerald-500/25 transition-colors"
                    title="Быстрый компактный виджет"
                  >
                    Виджет
                  </button>
                  <button
                    onClick={() => handleAction(() => onNavigate('assistant'))}
                    className="p-1 rounded-lg text-zinc-400 hover:text-emerald-500 transition-colors"
                    title="Открыть сайт ИИ"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Служба поддержки */}
            <button
              onClick={() => handleAction(() => onNavigate('contact'))}
              className={`w-full group p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                currentSection === 'contact'
                  ? 'border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15'
                  : 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>{t.supportTitle}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{t.supportSub}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
            </button>

            {/* 4. Админ-панель (Visible if user?.role === 'admin') */}
            {user?.role === 'admin' && (
              <button
                onClick={() => handleAction(() => onNavigate('admin'))}
                className={`w-full group p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  currentSection === 'admin'
                    ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15'
                    : 'border-amber-500/25 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <span>{t.adminTitle}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{t.adminSub}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Quick Core Links (Great for Mobile Viewports) */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="px-1 text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
              {t.navHeading}
            </div>

            <button
              onClick={() => handleAction(() => onNavigate('home'))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                currentSection === 'home'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t.homeTitle}</span>
            </button>

            <button
              onClick={() => handleAction(() => onNavigate('catalog'))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                currentSection === 'catalog'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>{t.catalogTitle}</span>
            </button>

            <button
              onClick={() => handleAction(() => onNavigate('passport'))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                currentSection === 'passport'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{t.passportTitle}</span>
            </button>

            <button
              onClick={() => handleAction(() => onNavigate('faq'))}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${
                currentSection === 'faq'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
            >
              <FileQuestion className="w-4 h-4" />
              <span>{t.faqTitle}</span>
            </button>
          </div>

          {/* Zero-Retention Privacy Card */}
          <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.privacyBadge}</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {t.privacyText}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          {user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction(onLogout)}
              className="text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/10 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.signOutBtn}</span>
            </Button>
          ) : (
            <span className="text-[11px] text-zinc-400">SIHAT Clarity v3.2</span>
          )}

          <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            Zero-Retention Protocol
          </div>
        </div>
      </aside>
    </div>
  )
}
