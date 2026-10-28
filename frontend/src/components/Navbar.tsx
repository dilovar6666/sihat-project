import React, { useState, useRef, useEffect } from 'react'
import { Globe, ShieldAlert, LogIn, Bell } from 'lucide-react'
import type { Language, Translations } from '../i18n'
import type { UserProfile } from '../types'
import { UserAvatar } from './UserAvatar'
import { StarThemeToggle } from './StarThemeToggle'
import { useLiquidPill } from '../hooks/useLiquidPill'

interface NavbarProps {
  t: Translations
  lang: Language
  onSelectLang: (lang: Language, e?: React.MouseEvent<HTMLElement>) => void
  theme: 'light' | 'dark'
  onToggleTheme: (e?: React.MouseEvent<HTMLElement>) => void
  user: UserProfile | null
  onOpenAuth: () => void
  onLogout: () => void
  onNavigate: (sectionId: string) => void
  currentSection: string
  onOpenAssistant: () => void
  onOpenProfile: () => void
  onToggleNotifications?: () => void
  unreadNotificationsCount?: number
}

export const Navbar: React.FC<NavbarProps> = ({
  t,
  lang,
  onSelectLang,
  theme,
  onToggleTheme,
  user,
  onNavigate,
  currentSection,
  onToggleNotifications,
  unreadNotificationsCount = 0,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Core navigation links
  const navLinks = [
    { id: 'catalog', label: t.nav?.catalog || (lang === 'tj' ? 'Феҳрист' : lang === 'en' ? 'Catalog' : 'Каталог') },
    { id: 'methodologies', label: lang === 'tj' ? 'Методология' : lang === 'en' ? 'Methodology' : 'Методология' },
    { id: 'faq', label: t.nav?.faq || (lang === 'tj' ? 'Пойгоҳи дониш' : lang === 'en' ? 'Knowledge' : 'База знаний') },
  ]

  const activeNavId =
    currentSection === 'passport' || currentSection === 'methodologies'
      ? 'methodologies'
      : navLinks.some((l) => l.id === currentSection)
      ? currentSection
      : null

  const { containerRef: navContainerRef, pillRef: navPillRef, itemRefs: navItemRefs } = useLiquidPill(
    activeNavId,
    { orientation: 'horizontal' }
  )

  const handleNavClick = (id: string) => {
    onNavigate(id)
  }

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 z-40 flex justify-center px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-7xl rounded-full liquid-glass shadow-xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between transition-all">
        {/* Left: Brand Logo */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center text-left group focus:outline-none pl-1 cursor-pointer"
          aria-label="На главную страницу SIHAT"
        >
          <img
            src="/sihat-logo.png"
            alt="SIHAT"
            className="h-7 sm:h-8 w-auto object-contain dark:brightness-175 dark:contrast-110 transition-transform group-hover:scale-105"
          />
        </button>

        {/* Center: Core Floating Pill Links with iOS Liquid Glass Transition */}
        <nav
          ref={navContainerRef}
          className="hidden md:flex items-center gap-1 p-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.03] dark:border-white/[0.05] relative shadow-inner"
        >
          {/* Fluid Liquid Glass Pill Indicator */}
          <div ref={navPillRef} className="liquid-glass-active-pill" />

          {navLinks.map((link) => {
            const isActive = activeNavId === link.id
            return (
              <button
                key={link.id}
                ref={(el) => {
                  navItemRefs.current[link.id] = el
                }}
                onClick={() => handleNavClick(link.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer relative z-10 ${
                  isActive
                    ? 'text-[#103D35] dark:text-[#2EC4A7] font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {link.label}
              </button>
            )
          })}
        </nav>

        {/* Right: Controls & Direct Profile / Login Navigation */}
        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-pill text-slate-700 dark:text-slate-300 text-xs font-bold uppercase transition-all duration-200 active:scale-95 hover:scale-105 hover:text-[#17A884] dark:hover:text-[#2EC4A7] cursor-pointer"
              aria-label="Выбрать язык"
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              <span className="relative z-10">{lang}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-40 rounded-2xl bg-white/95 dark:bg-[#0E1715]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#1E302B] shadow-2xl py-1.5 z-50 text-xs origin-top-right transition-all duration-250 ease-out animate-in fade-in zoom-in-90 slide-in-from-top-2 overflow-hidden">
                <button
                  onClick={(e) => {
                    onSelectLang('ru', e)
                    setLangMenuOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-[#131C1A] flex items-center justify-between transition-colors cursor-pointer ${
                    lang === 'ru'
                      ? 'font-bold text-[#17A884] dark:text-[#2EC4A7] bg-[#17A884]/10 dark:bg-[#17A884]/15'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Русский</span>
                  <span className="text-[10px] text-slate-400 font-mono">RU</span>
                </button>
                <button
                  onClick={(e) => {
                    onSelectLang('tj', e)
                    setLangMenuOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-[#131C1A] flex items-center justify-between transition-colors cursor-pointer ${
                    lang === 'tj'
                      ? 'font-bold text-[#17A884] dark:text-[#2EC4A7] bg-[#17A884]/10 dark:bg-[#17A884]/15'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Тоҷикӣ</span>
                  <span className="text-[10px] text-slate-400 font-mono">TJ</span>
                </button>
                <button
                  onClick={(e) => {
                    onSelectLang('en', e)
                    setLangMenuOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-[#131C1A] flex items-center justify-between transition-colors cursor-pointer ${
                    lang === 'en'
                      ? 'font-bold text-[#17A884] dark:text-[#2EC4A7] bg-[#17A884]/10 dark:bg-[#17A884]/15'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>English</span>
                  <span className="text-[10px] text-slate-400 font-mono">EN</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications Center Toggle */}
          {onToggleNotifications && (
            <button
              onClick={onToggleNotifications}
              className="relative w-9 h-9 rounded-full liquid-glass-pill text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all hover:text-[#17A884] cursor-pointer"
              aria-label="Центр уведомлений"
              title="Уведомления"
            >
              <Bell className="w-4 h-4 relative z-10" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#17A884] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse z-20">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Aaron Iker Animated Star Theme Toggle */}
          <StarThemeToggle theme={theme} onToggle={onToggleTheme} />

          {/* Direct Profile or Login Navigation */}
          {user ? (
            <button
              onClick={() => onNavigate('profile')}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full liquid-glass-pill transition-all text-xs font-semibold group shadow-xs cursor-pointer ${
                currentSection === 'profile'
                  ? 'border-[#17A884] bg-[#17A884]/20 text-[#103D35] dark:text-[#2EC4A7]'
                  : 'border-[#17A884]/40 bg-[#17A884]/10 hover:bg-[#17A884]/20 text-slate-800 dark:text-slate-200'
              }`}
              title="Перейти в личный кабинет"
              aria-label="Личный кабинет"
            >
              <UserAvatar user={user} size="sm" />
              <span className="hidden sm:inline-block max-w-[90px] truncate font-bold relative z-10">
                {user.full_name || (user.email ? user.email.split('@')[0] : user.phone || 'Профиль')}
              </span>
              {user.role === 'admin' && (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 relative z-10" />
              )}
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-glass-pill transition-all text-xs font-bold group shadow-xs cursor-pointer ${
                currentSection === 'login' || currentSection === 'register'
                  ? 'border-[#17A884] bg-[#17A884] text-white shadow-md'
                  : 'hover:border-[#17A884]/50 hover:text-[#17A884] text-slate-700 dark:text-slate-300'
              }`}
              title="Войти в личный кабинет"
              aria-label="Войти"
            >
              <LogIn className="w-3.5 h-3.5 text-[#17A884] group-hover:scale-110 transition-transform relative z-10" />
              <span className="relative z-10">{lang === 'tj' ? 'Воридшавӣ' : lang === 'en' ? 'Sign In' : 'Войти'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
