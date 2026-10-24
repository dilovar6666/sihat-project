import React, { useState, useRef, useEffect } from 'react'
import { Globe, Moon, Sun, ShieldAlert, LogIn } from 'lucide-react'
import type { Language, Translations } from '../i18n'
import type { UserProfile } from '../types'
import { UserAvatar } from './UserAvatar'

interface NavbarProps {
  t: Translations
  lang: Language
  onSelectLang: (lang: Language) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  user: UserProfile | null
  onOpenAuth: () => void
  onLogout: () => void
  onNavigate: (sectionId: string) => void
  currentSection: string
  onOpenAssistant: () => void
  onOpenProfile: () => void
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
    { id: 'home', label: t.nav?.home || (lang === 'tj' ? 'Асосӣ' : lang === 'en' ? 'Home' : 'Главная') },
    { id: 'catalog', label: t.nav?.catalog || (lang === 'tj' ? 'Феҳрист' : lang === 'en' ? 'Catalog' : 'Каталог') },
    { id: 'methodologies', label: lang === 'tj' ? 'Методология' : lang === 'en' ? 'Methodology' : 'Методология' },
    { id: 'faq', label: t.nav?.faq || (lang === 'tj' ? 'Пойгоҳи дониш' : lang === 'en' ? 'Knowledge' : 'База знаний') },
  ]

  const handleNavClick = (id: string) => {
    onNavigate(id)
  }

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-5xl rounded-full liquid-glass shadow-xl px-3 sm:px-5 h-14 flex items-center justify-between transition-all">
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

        {/* Center: Core Floating Pill Links */}
        <nav className="hidden md:flex items-center gap-1 liquid-glass-pill p-1 rounded-full shadow-xs">
          {navLinks.map((link) => {
            const isActive =
              currentSection === link.id ||
              (link.id === 'methodologies' &&
                (currentSection === 'passport' || currentSection === 'methodologies'))
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'liquid-glass text-[#17A884] dark:text-[#2EC4A7] shadow-xs font-bold border-[#17A884]/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-800/40'
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full liquid-glass-pill hover:border-[#17A884]/40 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase transition-all cursor-pointer"
              aria-label="Выбрать язык"
              aria-expanded={langMenuOpen}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{lang}</span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-2xl liquid-glass shadow-xl py-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    onSelectLang('ru')
                    setLangMenuOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer ${
                    lang === 'ru'
                      ? 'font-bold text-[#17A884] dark:text-[#2EC4A7]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Русский</span>
                  <span className="text-[10px] text-slate-400 font-mono">RU</span>
                </button>
                <button
                  onClick={() => {
                    onSelectLang('tj')
                    setLangMenuOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer ${
                    lang === 'tj'
                      ? 'font-bold text-[#17A884] dark:text-[#2EC4A7]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>Тоҷикӣ</span>
                  <span className="text-[10px] text-slate-400 font-mono">TJ</span>
                </button>
                <button
                  onClick={() => {
                    onSelectLang('en')
                    setLangMenuOpen(false)
                  }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors cursor-pointer ${
                    lang === 'en'
                      ? 'font-bold text-[#17A884] dark:text-[#2EC4A7]'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>English</span>
                  <span className="text-[10px] text-slate-400 font-mono">EN</span>
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full liquid-glass-pill hover:border-[#17A884]/40 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all hover:text-[#17A884] cursor-pointer"
            aria-label="Переключить тему оформления"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

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
              <span className="hidden sm:inline-block max-w-[90px] truncate font-bold">
                {user.full_name || user.email.split('@')[0]}
              </span>
              {user.role === 'admin' && (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
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
              <LogIn className="w-3.5 h-3.5 text-[#17A884] group-hover:scale-110 transition-transform" />
              <span>{lang === 'tj' ? 'Воридшавӣ' : lang === 'en' ? 'Sign In' : 'Войти'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
