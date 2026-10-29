import { useEffect, useState, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { Navbar } from './components/Navbar'
import { CustomCursor } from './components/CustomCursor'
import { LandingHero } from './components/LandingHero'
import { BentoFeatures } from './components/BentoFeatures'
import { CatalogSection } from './components/CatalogSection'
import { MethodologyPage } from './components/MethodologyPage'
import { RunnerModal } from './components/RunnerModal'
import { TestRunnerPage } from './components/TestRunnerPage'
import { HistorySection } from './components/HistorySection'
import { KnowledgeFaq } from './components/KnowledgeFaq'
import { ContactSection } from './components/ContactSection'
import { AuthPage } from './components/AuthPage'
import { AdminDashboard } from './components/AdminDashboard'
import { ProfilePage } from './components/ProfilePage'
import { AssistantPage } from './components/AssistantPage'
import { AssistantDrawer } from './components/AssistantDrawer'
import { FloatingAiButton } from './components/FloatingAiButton'
import { ProfileDrawer } from './components/ProfileDrawer'
import { NotificationsDrawer, type NotificationItem } from './components/NotificationsDrawer'
import { Footer } from './components/Footer'
import { translations } from './i18n'
import type { Language } from './i18n'
import {
  apiRequest,
  downloadPdfBlob,
  getRefreshToken,
  restoreSessionTokens,
  setApiToken,
  setRefreshToken,
} from './api'
import type {
  Attempt,
  Category,
  Completion,
  FaqItem,
  KnowledgeArticle,
  SavedResult,
  TestItem,
  UserProfile,
} from './types'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('sihat_theme') as 'light' | 'dark') || 'dark'
  })

  // Language state
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('sihat_lang') as Language) || 'ru'
  })

  // Auth & User state
  const [token, setToken] = useState<string>('')
  const [user, setUser] = useState<UserProfile | null>(null)

  // Navigation and active page
  type PageId =
    | 'home'
    | 'catalog'
    | 'history'
    | 'faq'
    | 'contact'
    | 'admin'
    | 'test'
    | 'profile'
    | 'assistant'
    | 'passport'
    | 'methodologies'
    | 'login'
    | 'register'
    | 'forgot-password'
    | 'reset-password'

  const parseHash = (): { page: PageId; testSlug: string | null; token: string | null } => {
    const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '').trim() : ''
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#/', '').replace('#', '').trim() : ''

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
    let token = urlParams.get('token')

    let raw = hash || pathname
    if (raw.includes('?')) {
      const parts = raw.split('?')
      raw = parts[0]
      if (!token) {
        const hashParams = new URLSearchParams(parts[1])
        token = hashParams.get('token')
      }
    }

    if (raw.startsWith('test/')) {
      const slug = raw.replace('test/', '').trim()
      return { page: 'test', testSlug: slug, token: null }
    }
    if (raw.startsWith('passport/')) {
      const slug = raw.replace('passport/', '').trim()
      return { page: 'passport', testSlug: slug, token: null }
    }
    if (raw === 'methodology' || raw.startsWith('methodology/')) {
      const slug = raw.replace('methodology/', '').replace('methodology', '').trim()
      return { page: 'passport', testSlug: slug || null, token: null }
    }
    if (raw === 'methodologies') {
      return { page: 'methodologies', testSlug: null, token: null }
    }
    if (
      [
        'home',
        'catalog',
        'history',
        'faq',
        'contact',
        'admin',
        'profile',
        'assistant',
        'passport',
        'methodologies',
        'login',
        'register',
        'forgot-password',
        'reset-password',
      ].includes(raw)
    ) {
      return { page: raw as PageId, testSlug: null, token }
    }
    return { page: 'home', testSlug: null, token }
  }

  const [currentPage, setCurrentPage] = useState<PageId>(() => parseHash().page)
  const [currentTestSlug, setCurrentTestSlug] = useState<string | null>(() => parseHash().testSlug)
  const [resetTokenParam, setResetTokenParam] = useState<string | null>(() => parseHash().token)

  useEffect(() => {
    const onLocationChange = () => {
      const parsed = parseHash()
      setCurrentPage(parsed.page)
      setCurrentTestSlug(parsed.testSlug)
      if (parsed.token) {
        setResetTokenParam(parsed.token)
      }
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onLocationChange)
    window.addEventListener('popstate', onLocationChange)
    return () => {
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
  }, [])

  const handleNavigate = (pageId: string) => {
    if (pageId.startsWith('test/')) {
      const slug = pageId.replace('test/', '').trim()
      setCurrentPage('test')
      setCurrentTestSlug(slug)
      window.location.hash = `#/test/${slug}`
    } else if (pageId.startsWith('passport/')) {
      const slug = pageId.replace('passport/', '').trim()
      setCurrentPage('passport')
      setCurrentTestSlug(slug)
      window.location.hash = `#/passport/${slug}`
    } else if (pageId === 'passport' || pageId === 'methodologies') {
      setCurrentPage('methodologies')
      setCurrentTestSlug(null)
      window.location.hash = '#/methodologies'
    } else {
      const valid = [
        'home',
        'catalog',
        'history',
        'faq',
        'contact',
        'admin',
        'profile',
        'assistant',
        'passport',
        'methodologies',
        'login',
        'register',
        'forgot-password',
        'reset-password',
      ].includes(pageId)
        ? (pageId as PageId)
        : 'home'
      setCurrentPage(valid)
      setCurrentTestSlug(null)
      window.location.hash = valid === 'home' ? '' : `#/${valid}`
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Data
  const [tests, setTests] = useState<TestItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [faq, setFaq] = useState<FaqItem[]>([])
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [results, setResults] = useState<SavedResult[]>([])

  // Active Modals & Testing Flows
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null)
  const [activeCompletion, setActiveCompletion] = useState<Completion | null>(null)
  const [runnerAnswer, setRunnerAnswer] = useState('')
  const [runnerLoading, setRunnerLoading] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      addToast('Соединение с сетью восстановлено', 'success')
    }
    const handleOffline = () => {
      setIsOnline(false)
      addToast('Соединение с сетью потеряно. Режим офлайн активен.', 'warning')
    }
    const handleExpired = () => {
      setToken('')
      setUser(null)
      addToast('Сессия истекла. Пожалуйста, выполните вход снова.', 'warning')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('sihat:session_expired', handleExpired)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('sihat:session_expired', handleExpired)
    }
  }, [])

  // Persistent Notification Center & Ephemeral Toast Stack
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('sihat_notifications')
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'init-1',
              message: 'Добро пожаловать на доказательную платформу SIHAT!',
              type: 'success',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
            },
            {
              id: 'init-2',
              message: 'Архитектура Zero-Retention активна: персональные данные защищены.',
              type: 'info',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: false,
            },
          ]
    } catch {
      return []
    }
  })

  // Auto-Dismissing Toast Notifications System
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const newToast: ToastItem = { id, message, type }

      // 1. Show floating toast in the bottom right corner
      setToasts((prev) => [...prev, newToast].slice(-4))

      // 2. Also log every notification into the site Notification Center
      setNotifications((prev) => {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const updated: NotificationItem[] = [
          {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            message,
            type,
            timestamp: timeStr,
            read: false,
          },
          ...prev.slice(0, 49),
        ]
        try {
          localStorage.setItem('sihat_notifications', JSON.stringify(updated))
        } catch {}
        return updated
      })

      // Auto-dismiss timeouts based on specification:
      // Success: 4000ms, Info: 5000ms, Warning: 7000ms, Critical/Error: persistent until closed
      if (type !== 'error') {
        const timeoutMs = type === 'success' ? 4000 : type === 'warning' ? 7000 : 5000
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id))
        }, timeoutMs)
      }
    },
    []
  )

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      try {
        localStorage.setItem('sihat_notifications', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
    try {
      localStorage.removeItem('sihat_notifications')
    } catch {}
  }

  const handleMarkOneNotificationRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      try {
        localStorage.setItem('sihat_notifications', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const handleDeleteOneNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      try {
        localStorage.setItem('sihat_notifications', JSON.stringify(updated))
      } catch {}
      return updated
    })
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const t = translations[lang] || translations.ru

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.style.colorScheme = 'dark'
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.colorScheme = 'light'
    }
    localStorage.setItem('sihat_theme', theme)
  }, [theme])

  // Language ripple wave
  const [langWave, setLangWave] = useState<{ x: number; y: number } | null>(null)

  // Sync language with wave animation
  const handleSelectLang = (newLang: Language, e?: React.MouseEvent<HTMLElement>) => {
    let x = window.innerWidth - 120
    let y = 30
    if (e?.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    }
    setLangWave({ x, y })
    setTimeout(() => setLangWave(null), 850)
    setLang(newLang)
    localStorage.setItem('sihat_lang', newLang)
  }

  // Theme transition state for visible shockwave ripple
  const [themeWave, setThemeWave] = useState<{
    x: number
    y: number
    targetTheme: 'light' | 'dark'
  } | null>(null)

  // 60 FPS GPU-optimized theme toggle with progressive wave, subtle blur and zoom starting from button
  const toggleTheme = (e?: React.MouseEvent<HTMLElement>) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    // Determine exact coordinates of the clicked toggle button
    let x = window.innerWidth / 2
    let y = 30

    if (e?.currentTarget) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      x = rect.left + rect.width / 2
      y = rect.top + rect.height / 2
    } else {
      const btn = document.getElementById('theme-toggle-btn')
      if (btn) {
        const rect = btn.getBoundingClientRect()
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 2
      }
    }

    // Trigger visible shockwave ripple ring
    setThemeWave({ x, y, targetTheme: nextTheme })
    setTimeout(() => setThemeWave(null), 900)

    const doc = document as any
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in doc &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      // Freeze inner transitions during snapshot capture to eliminate DOM layout thrashing
      document.documentElement.classList.add('theme-transitioning')

      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          setTheme(nextTheme)
          if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
          localStorage.setItem('sihat_theme', nextTheme)
        })
      })

      transition.ready
        .then(() => {
          // Outgoing view: initial slight zoom and lightweight soft blur (GPU-optimized)
          document.documentElement.animate(
            [
              {
                transform: 'scale(1)',
                filter: 'blur(0px)',
              },
              {
                transform: 'scale(1.02)',
                filter: 'blur(3px)',
              },
            ],
            {
              duration: 380,
              easing: 'ease-out',
              pseudoElement: '::view-transition-old(root)',
            }
          )

          // Incoming view: expanding circular wave from button with progressive sharpening
          document.documentElement.animate(
            [
              {
                clipPath: `circle(0px at ${x}px ${y}px)`,
                transform: 'scale(1.025)',
                filter: 'blur(4px)',
              },
              {
                clipPath: `circle(${endRadius * 0.45}px at ${x}px ${y}px)`,
                transform: 'scale(1.01)',
                filter: 'blur(1.5px)',
              },
              {
                clipPath: `circle(${endRadius}px at ${x}px ${y}px)`,
                transform: 'scale(1)',
                filter: 'blur(0px)',
              },
            ],
            {
              duration: 720,
              easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          )
        })
        .catch(() => {
          setTheme(nextTheme)
        })

      transition.finished.finally(() => {
        document.documentElement.classList.remove('theme-transitioning')
      })
    } else {
      setTheme(nextTheme)
    }
  }

  // Restore authenticated session
  useEffect(() => {
    const session = restoreSessionTokens()
    if (!session.refreshToken) return

    void apiRequest<{ access_token: string; refresh_token: string; user: UserProfile }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      }
    )
      .then((res) => {
        setApiToken(res.access_token)
        setRefreshToken(res.refresh_token)
        setToken(res.access_token)
        setUser(res.user)
      })
      .catch(() => {
        setApiToken('')
        setRefreshToken('')
      })
  }, [])

  // Load initial public content
  useEffect(() => {
    void Promise.all([
      apiRequest<TestItem[]>('/tests').catch(() => []),
      apiRequest<Category[]>('/categories').catch(() => []),
      apiRequest<FaqItem[]>('/faq').catch(() => []),
      apiRequest<KnowledgeArticle[]>('/knowledge').catch(() => []),
    ]).then(([tList, cList, fList, aList]) => {
      setTests(tList)
      setCategories(cList)
      setFaq(fList)
      setArticles(aList)
    })
  }, [])

  // Load user history when authenticated
  const loadHistory = async () => {
    if (!token) return
    try {
      const data = await apiRequest<SavedResult[]>('/results/history')
      setResults(data)
    } catch {
      // Ignore if unauthorized
    }
  }

  useEffect(() => {
    if (token) {
      loadHistory()
    } else {
      setResults([])
    }
  }, [token])

  // Logout
  const handleLogout = () => {
    const rt = getRefreshToken()
    if (rt) {
      void apiRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: rt }),
      }).catch(() => {})
    }
    setApiToken('')
    setRefreshToken('')
    setToken('')
    setUser(null)
    addToast('Вы вышли из системы.', 'info')
    handleNavigate('home')
  }

  // Test Runner Flow
  const handleStartAttempt = (item: TestItem) => {
    handleNavigate(`test/${item.slug}`)
  }

  const handleSubmitAnswer = async () => {
    if (!activeAttempt?.current_question || !runnerAnswer) return

    setRunnerLoading(true)
    try {
      const nextAttempt = await apiRequest<Attempt>(
        `/attempts/${activeAttempt.id}/answer`,
        {
          method: 'POST',
          body: JSON.stringify({
            question_id: activeAttempt.current_question.id,
            answer: runnerAnswer,
          }),
        }
      )

      setRunnerAnswer('')
      if (nextAttempt.current_question) {
        setActiveAttempt(nextAttempt)
      } else {
        // Complete attempt -> triggers Consent Gate
        const completion = await apiRequest<Completion>(
          `/attempts/${activeAttempt.id}/complete`,
          { method: 'POST' }
        )
        setActiveAttempt(null)
        setActiveCompletion(completion)
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Ошибка отправки ответа', 'error')
    } finally {
      setRunnerLoading(false)
    }
  }

  const handleConsentChoice = async (save: boolean) => {
    if (!activeCompletion) return

    setRunnerLoading(true)
    try {
      await apiRequest(
        `/attempts/${activeCompletion.id}/${save ? 'save' : 'do-not-save'}`,
        { method: 'POST' }
      )
      setActiveCompletion(null)
      addToast(
        save
          ? 'Результат успешно сохранён в вашем личном архиве.'
          : 'Результат и все временные ответы безвозвратно удалены.',
        save ? 'success' : 'info'
      )
      if (save) {
        loadHistory()
      }
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Ошибка фиксации выбора', 'error')
    } finally {
      setRunnerLoading(false)
    }
  }

  // Delete saved result
  const handleDeleteResult = async (resultId: string) => {
    try {
      await apiRequest(`/results/${resultId}`, { method: 'DELETE' })
      setResults((prev) => prev.filter((r) => r.id !== resultId))
      addToast('Запись успешно удалена из вашего архива.', 'success')
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Ошибка при удалении', 'error')
    }
  }

  // Clear all saved results
  const handleClearAllHistory = async () => {
    if (!confirm('Вы уверены, что хотите полностью стереть все сохранённые результаты?')) {
      return
    }
    try {
      await apiRequest('/results/history', { method: 'DELETE' })
      setResults([])
      addToast('Весь личный архив результатов успешно стерт.', 'success')
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Ошибка очистки архива', 'error')
    }
  }

  // Download PDF
  const handleDownloadPdf = async (resultId: string) => {
    try {
      await downloadPdfBlob(resultId, {
        include_result: true,
        include_methodology: true,
        include_limitations: true,
        include_answers: false,
        include_warnings: true,
        lang,
      })
      addToast('PDF-паспорт успешно сформирован и скачан.', 'success')
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : 'Ошибка загрузки PDF', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9F5] dark:bg-[#101716] text-[#202827] dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      <CustomCursor />
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg animate-pulse">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            {lang === 'tj'
              ? 'Алоқа бо интернет канда шуд. Кӯшиши фаъол дар сервер ҳифз шудааст ва пас аз барқарор шудани шабака идома меёбад.'
              : lang === 'en'
              ? 'Network connection lost. Your active server attempt snapshot is preserved and can be resumed once back online.'
              : 'Режим офлайн: соединение с сервером потеряно. Снимок активной попытки сохранён на сервере — прохождение можно продолжить после восстановления связи.'}
          </span>
        </div>
      )}
      {/* Floating Dynamic Navbar */}
      <Navbar
        t={t}
        lang={lang}
        onSelectLang={handleSelectLang}
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onOpenAuth={() => handleNavigate('login')}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentSection={currentPage}
        onOpenAssistant={() => setAssistantOpen(true)}
        onOpenProfile={() => setProfileDrawerOpen(true)}
        onToggleNotifications={() => setNotificationsOpen((prev) => !prev)}
        unreadNotificationsCount={notifications.filter((n) => !n.read).length}
      />

      {/* Main Content Pages (Separated by Route) */}
      <main className="min-h-[75vh] pt-20 sm:pt-24">
        <div key={currentPage} className="animate-in fade-in-50 duration-200">
          {currentPage === 'home' && (
          <>
            <LandingHero
              t={t}
              lang={lang}
              tests={tests}
              onOpenCatalog={() => handleNavigate('catalog')}
              onOpenMethodology={() => handleNavigate('methodologies')}
              onSelectTest={(item) => handleNavigate(`passport/${item.slug}`)}
              onStartScreening={(slug) => {
                const found = tests.find((x) => x.slug === slug)
                if (found) {
                  handleStartAttempt(found)
                } else {
                  handleNavigate(`test/${slug}`)
                }
              }}
            />
            <BentoFeatures
              t={t}
              lang={lang}
              onOpenMethodology={() => handleNavigate('methodologies')}
              onOpenCatalog={() => handleNavigate('catalog')}
              onOpenAssistant={() => setAssistantOpen(true)}
            />
          </>
        )}

        {currentPage === 'test' && currentTestSlug && (
          <TestRunnerPage
            slug={currentTestSlug}
            lang={lang}
            token={token}
            allTests={tests}
            onBackToCatalog={() => handleNavigate('catalog')}
            onOpenAuth={() => handleNavigate('login')}
            onNotify={(msg) => addToast(msg, 'info')}
          />
        )}

        {(currentPage === 'passport' || currentPage === 'methodologies') && (
          <MethodologyPage
            tests={tests}
            categories={categories}
            currentSlug={currentTestSlug}
            lang={lang}
            token={token}
            onNavigate={handleNavigate}
            onStartAttempt={(item) => handleStartAttempt(item)}
            onOpenAuth={() => handleNavigate('login')}
          />
        )}

        {currentPage === 'catalog' && (
          <CatalogSection
            t={t}
            lang={lang}
            tests={tests}
            categories={categories}
            onSelectTest={(item) => handleNavigate(`passport/${item.slug}`)}
            onStartAttempt={(item) => handleStartAttempt(item)}
          />
        )}

        {currentPage === 'history' && (
          <HistorySection
            results={results}
            onDownloadPdf={handleDownloadPdf}
            onDeleteResult={handleDeleteResult}
            onClearAll={handleClearAllHistory}
            onOpenCatalog={() => handleNavigate('catalog')}
            token={token}
            onOpenAuth={() => handleNavigate('login')}
            lang={lang}
          />
        )}

        {currentPage === 'faq' && (
          <KnowledgeFaq
            t={t}
            lang={lang}
            faq={faq}
            articles={articles}
          />
        )}

        {currentPage === 'contact' && (
          <ContactSection lang={lang} t={t} onNotify={(msg) => addToast(msg, 'info')} />
        )}

        {currentPage === 'admin' && (
          <AdminDashboard
            token={token}
            user={user}
            lang={lang}
            onNotify={(msg) => addToast(msg, 'info')}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            user={user}
            token={token}
            lang={lang}
            results={results}
            onDownloadPdf={handleDownloadPdf}
            onDeleteResult={handleDeleteResult}
            onClearAll={handleClearAllHistory}
            onOpenAuth={() => handleNavigate('login')}
            onUpdateUser={(updated) => setUser(updated)}
            onNavigate={handleNavigate}
            onNotify={(msg) => addToast(msg, 'info')}
            onLogout={handleLogout}
            onOpenNotifications={() => setNotificationsOpen(true)}
            unreadNotificationsCount={notifications.filter((n) => !n.read).length}
          />
        )}

        {currentPage === 'assistant' && (
          <AssistantPage
            user={user}
            lang={lang}
            onNavigate={handleNavigate}
            onNotify={(msg) => addToast(msg, 'info')}
          />
        )}

        {/* Dedicated Auth Routes */}
        {(currentPage === 'login' ||
          currentPage === 'register' ||
          currentPage === 'forgot-password' ||
          currentPage === 'reset-password') && (
          <AuthPage
            initialMode={currentPage as any}
            initialToken={resetTokenParam}
            lang={lang}
            onSuccess={(newUser, newToken) => {
              setUser(newUser)
              setToken(newToken)
              setApiToken(newToken)
            }}
            onNotify={(msg) => addToast(msg, 'info')}
            onNavigate={handleNavigate}
          />
        )}
        </div>
      </main>

      {/* Footer */}
      <Footer t={t} lang={lang} onNavigate={handleNavigate} />

      {/* Test Runner & Consent Gate Modal */}
      <RunnerModal
        isOpen={Boolean(activeAttempt || activeCompletion)}
        onClose={() => {
          setActiveAttempt(null)
          setActiveCompletion(null)
        }}
        attempt={activeAttempt}
        completion={activeCompletion}
        answer={runnerAnswer}
        onSelectAnswer={setRunnerAnswer}
        onSubmitAnswer={handleSubmitAnswer}
        onConsentChoice={handleConsentChoice}
        lang={lang}
        loading={runnerLoading}
      />

      {/* Compact Floating Gemini AI Assistant */}
      <AssistantDrawer
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        onNavigateToCatalog={() => handleNavigate('catalog')}
        onNavigateToTest={(slug) => handleNavigate(`test/${slug}`)}
        onOpenDedicated={() => {
          handleNavigate('assistant')
          setAssistantOpen(false)
        }}
        lang={lang}
      />

      {/* Floating AI Trigger Action Button */}
      <FloatingAiButton
        isOpen={assistantOpen}
        onClick={() => setAssistantOpen((prev) => !prev)}
        lang={lang}
      />

      {/* User Profile & Services Drawer */}
      <ProfileDrawer
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        user={user}
        lang={lang}
        onOpenAuth={() => {
          setProfileDrawerOpen(false)
          handleNavigate('login')
        }}
        onLogout={handleLogout}
        onNavigate={(page) => {
          setProfileDrawerOpen(false)
          handleNavigate(page)
        }}
        onOpenAssistant={() => setAssistantOpen(true)}
        currentSection={currentPage}
      />

      {/* Notifications Drawer Center */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearAllNotifications}
        onMarkOneRead={handleMarkOneNotificationRead}
        onDeleteOne={handleDeleteOneNotification}
        lang={lang}
      />

      {/* Auto-Dismissing Toast Notifications Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200 border backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-[#103D35] text-white border-[#17A884]/40'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/95 text-amber-200 border-amber-500/40'
                  : toast.type === 'error'
                  ? 'bg-rose-950/95 text-rose-200 border-rose-500/40'
                  : 'bg-slate-900/95 text-slate-100 border-slate-700/60 dark:bg-slate-800/95'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#2EC4A7] shrink-0" />}
                {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                {toast.type === 'info' && <Info className="w-4 h-4 text-[#2EC4A7] shrink-0" />}
                <span className="leading-snug">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-lg text-white/50 hover:text-white cursor-pointer shrink-0 transition-colors"
                aria-label="Закрыть уведомление"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Fluid Theme Wave Shockwave Ring Originating from Button Coordinates */}
      {themeWave && (
        <div
          key={`theme-wave-${themeWave.x}-${themeWave.y}-${Date.now()}`}
          className={
            themeWave.targetTheme === 'dark'
              ? 'theme-ripple-wave-dark'
              : 'theme-ripple-wave-light'
          }
          style={{
            left: `${themeWave.x}px`,
            top: `${themeWave.y}px`,
          }}
        />
      )}

      {/* Language Switch Shockwave Wave */}
      {langWave && (
        <div
          key={`lang-wave-${langWave.x}-${langWave.y}-${Date.now()}`}
          className="lang-ripple-wave"
          style={{
            left: `${langWave.x}px`,
            top: `${langWave.y}px`,
          }}
        />
      )}
    </div>
  )
}
