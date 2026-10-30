import React, { useState, useEffect } from 'react'
import { ShieldCheck, Cookie, Settings2, Check, X } from 'lucide-react'
import { Button } from './ui/Button'
import type { Language } from '../i18n'

export interface CookiePreferences {
  necessary: boolean // Always true
  functional: boolean
  analytics: boolean
}

const STORAGE_KEY = 'sihat_cookie_consent_v1'

export function getStoredCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CookiePreferences
  } catch {
    return null
  }
}

export function saveCookieConsent(prefs: CookiePreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // Ignore storage errors
  }
}

interface CookieConsentBannerProps {
  lang: Language
  onNavigate?: (page: string) => void
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ lang, onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
  })

  useEffect(() => {
    const stored = getStoredCookieConsent()
    if (!stored) {
      // Small timeout for smooth appearance
      const timer = setTimeout(() => setIsVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAcceptAll = () => {
    const allIn: CookiePreferences = { necessary: true, functional: true, analytics: true }
    saveCookieConsent(allIn)
    setIsVisible(false)
    setShowSettingsModal(false)
  }

  const handleAcceptNecessary = () => {
    const necOnly: CookiePreferences = { necessary: true, functional: false, analytics: false }
    saveCookieConsent(necOnly)
    setIsVisible(false)
    setShowSettingsModal(false)
  }

  const handleSaveCustom = () => {
    saveCookieConsent(preferences)
    setIsVisible(false)
    setShowSettingsModal(false)
  }

  const t = {
    ru: {
      title: 'Управление конфиденциальностью и Cookie',
      desc: 'Мы используем файлы cookie для безопасной аутентификации, запоминания выбранного языка и темы, а также анонимного контроля качества платформы. Мы никогда не продаём ваши данные и не передаём результаты тестов сторонним рекламным сетям.',
      privacyLink: 'Политика конфиденциальности',
      acceptAll: 'Принять все',
      necessaryOnly: 'Только обязательные',
      customize: 'Настроить',
      modalTitle: 'Настройки файлов cookie',
      modalDesc: 'Выберите категории файлов cookie, которые вы разрешаете использовать на платформе SIHAT.',
      necessaryLabel: 'Обязательные технические cookie',
      necessaryDesc: 'Необходимы для работы платформы: сохранение защищённой сессии, авторизация, предотвращение CSRF-атак. Не могут быть отключены.',
      functionalLabel: 'Функциональные cookie',
      functionalDesc: 'Запоминают ваш выбранный язык (RU, TJ, EN), тёмную/светлую тему оформления и звуковые настройки в упражнениях.',
      analyticsLabel: 'Обезличенная аналитика качества',
      analyticsDesc: 'Помогает нам измерять стабильность работы упражнений без сбора персональных данных или ответов на тесты.',
      savePreferences: 'Сохранить настройки',
      alwaysActive: 'Всегда активно',
    },
    tj: {
      title: 'Идораи махфият ва файлҳои Cookie',
      desc: 'Мо файлҳои cookie-ро танҳо барои амнияти сессия, сабти забони интихобшуда ва кори дурусти машқҳо истифода мебарем. Натиҷаҳои шумо ҳеҷ гоҳ ба шабакаҳои таблиғотӣ дода намешаванд.',
      privacyLink: 'Сиёсати махфият',
      acceptAll: 'Ҳамаро қабул кардан',
      necessaryOnly: 'Танҳо ҳатмӣ',
      customize: 'Танзимот',
      modalTitle: 'Танзимоти файлҳои cookie',
      modalDesc: 'Категорияҳои файлҳои cookie-ро, ки шумо иҷозат медиҳед, интихоб кунед.',
      necessaryLabel: 'Cookie-ҳои ҳатмии техникӣ',
      necessaryDesc: 'Барои кори платформа, ҳифзи вуруд ва пешгирии ҳамлаҳо зарур мебошанд. Хомӯш карда намешаванд.',
      functionalLabel: 'Cookie-ҳои функсионалӣ',
      functionalDesc: 'Интихоби забон (RU, TJ, EN), мавзӯи равшан/торик ва танзимоти садоиро дар хотир нигоҳ медоранд.',
      analyticsLabel: 'Омори беном оид ба сифат',
      analyticsDesc: 'Барои санҷиши устувории тестҳо бидуни ҷамъоварии маълумоти шахсӣ кӯмак мекунад.',
      savePreferences: 'Сабти танзимот',
      alwaysActive: 'Ҳамеша фаъол',
    },
    en: {
      title: 'Privacy & Cookie Preferences',
      desc: 'We use cookies to maintain secure sessions, remember your language and theme preferences, and ensure test stability. We never sell your data or share health-related screening responses with advertising networks.',
      privacyLink: 'Privacy Policy',
      acceptAll: 'Accept All',
      necessaryOnly: 'Necessary Only',
      customize: 'Customize',
      modalTitle: 'Cookie Settings',
      modalDesc: 'Choose which cookie categories you permit on the SIHAT platform.',
      necessaryLabel: 'Strictly Necessary Cookies',
      necessaryDesc: 'Required for core platform functionality, secure authentication tokens, and CSRF protection. Cannot be disabled.',
      functionalLabel: 'Functional Cookies',
      functionalDesc: 'Remember your preferred language (RU, TJ, EN), theme, and audio playback toggles.',
      analyticsLabel: 'Anonymous Quality Telemetry',
      analyticsDesc: 'Helps us measure engine response latency without ever logging personal responses or health metrics.',
      savePreferences: 'Save Preferences',
      alwaysActive: 'Always active',
    },
  }[lang]

  if (!isVisible && !showSettingsModal) return null

  return (
    <>
      {/* Floating Bottom Banner */}
      {isVisible && !showSettingsModal && (
        <div
          data-testid="cookie-consent-banner"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t.title}</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t.desc}{' '}
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('privacy')}
                      className="text-emerald-600 dark:text-emerald-400 underline font-semibold hover:opacity-80 cursor-pointer"
                    >
                      {t.privacyLink}
                    </button>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsModal(true)}
                className="text-xs gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{t.customize}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptNecessary}
                className="text-xs border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <span>{t.necessaryOnly}</span>
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs font-bold gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t.acceptAll}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showSettingsModal && (
        <div
          data-testid="cookie-settings-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Settings2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.modalDesc}</p>

            <div className="space-y-4">
              {/* Necessary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t.necessaryLabel}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.necessaryDesc}</div>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  {t.alwaysActive}
                </span>
              </div>

              {/* Functional */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t.functionalLabel}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.functionalDesc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences((p) => ({ ...p, functional: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-0.5 shrink-0"
                />
              </div>

              {/* Analytics */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1 pr-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t.analyticsLabel}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.analyticsDesc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences((p) => ({ ...p, analytics: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-0.5 shrink-0"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAcceptNecessary}
                className="text-xs cursor-pointer"
              >
                <span>{t.necessaryOnly}</span>
              </Button>
              <Button
                variant="emerald"
                size="sm"
                onClick={handleSaveCustom}
                className="text-xs font-bold cursor-pointer shadow-md"
              >
                <span>{t.savePreferences}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
