import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { apiRequest, getRefreshToken, setApiToken, setRefreshToken } from './api'
import { AdminView } from './components/AdminView'
import { AuthModal } from './components/AuthModal'
import { CatalogView } from './components/CatalogView'
import { HistoryView } from './components/HistoryView'
import { LandingHero } from './components/LandingHero'
import { EDUCATIONAL_ACTIVITIES, ExercisePanel } from './components/RunnerView'
import { translations } from './i18n'
import type { Language } from './i18n'
import type {
  Activity,
  AssistantAction,
  AssistantReply,
  Attempt,
  Completion,
  DialogMessage,
  FaqItem,
  KnowledgeArticle,
  SupportTicket,
  TestItem,
  UserProfile,
} from './types'

export function App() {
  // Theme & Language Localization
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('sihat_theme') as 'light' | 'dark') || 'light'
  })
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('sihat_lang') as Language) || 'en'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sihat_theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('lang', lang)
    localStorage.setItem('sihat_lang', lang)
  }, [lang])

  const t = translations[lang]

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  // Auth & Session
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentTab, setCurrentTab] = useState<'home' | 'exercises' | 'catalog' | 'history' | 'faq' | 'knowledge' | 'support' | 'admin'>('exercises')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategory, setCatalogCategory] = useState('all')
  const resetTokenFromUrl = new URLSearchParams(window.location.search).get('token') ?? ''
  const [authModalOpen, setAuthModalOpen] = useState(Boolean(resetTokenFromUrl))

  // Runner state for exercise tests
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [ready, setReady] = useState(false)
  const [completion, setCompletion] = useState<Completion | null>(null)
  const [message, setMessage] = useState('')

  // Assistant state
  const [assistantOpen, setAssistantOpen] = useState(window.location.hash === '#assistant')
  const [assistantText, setAssistantText] = useState('')
  const [dialog, setDialog] = useState<DialogMessage[]>([])
  const [assistantActions, setAssistantActions] = useState<AssistantAction[]>([])

  // FAQ, Knowledge, Support & Admin state
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [supportEmail, setSupportEmail] = useState('')
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([])

  // Login handler
  const login = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const body = await apiRequest<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(body.access_token)
      setApiToken(body.access_token)
      setRefreshToken(body.refresh_token)
      setMessage('')
      try {
        const p = await apiRequest<UserProfile>('/me/profile', {
          headers: { Authorization: `Bearer ${body.access_token}` },
        })
        setProfile(p)
      } catch {
        setProfile({ id: 'u', email, full_name: email, role: 'user', age_group: '18_plus' })
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to sign in')
    }
  }

  const signOut = () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) void apiRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }).catch(() => {})
    setToken('')
    setApiToken('')
    setRefreshToken('')
    setProfile(null)
    setCompletion(null)
    setAttempt(null)
    setSelectedActivity(null)
    setCurrentTab('home')
    setMessage('Вы вышли из учетной записи.')
  }

  const startExercise = async (act: Activity) => {
    if (!token) {
      setSelectedActivity(act)
      setAuthModalOpen(true)
      setMessage(t.exercises.guestNotice)
      return
    }
    try {
      const next = await apiRequest<Attempt>('/attempts/start', {
        method: 'POST',
        body: JSON.stringify({ test_slug: act.slug }),
      })
      setAttempt(next)
      setSelectedActivity(act)
      setReady(false)
      setMessage('')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось запустить упражнение')
    }
  }

  const respondExercise = async (answer: 'completed' | 'skipped') => {
    if (!attempt?.current_question) return
    try {
      const advanced = await apiRequest<Attempt>(`/attempts/${attempt.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ question_id: attempt.current_question.id, answer }),
      })
      if (advanced.current_question) {
        setAttempt(advanced)
        return
      }
      const finished = await apiRequest<Completion>(`/attempts/${attempt.id}/complete`, { method: 'POST' })
      setCompletion(finished)
      setAttempt(null)
      setSelectedActivity(null)
      setReady(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось сохранить ответ')
    }
  }

  const discardExercise = async () => {
    if (attempt) {
      try {
        await apiRequest(`/attempts/${attempt.id}/discard`, { method: 'DELETE' })
      } catch {
        /* Session can close locally */
      }
    }
    setAttempt(null)
    setSelectedActivity(null)
    setReady(false)
  }

  const decideSave = async (save: boolean) => {
    if (!completion) return
    try {
      await apiRequest(`/attempts/${completion.id}/${save ? 'save' : 'do-not-save'}`, { method: 'POST' })
      setCompletion(null)
      setMessage(
        save
          ? 'Your exercise result was saved to your private history.'
          : 'Your temporary exercise result was deleted.'
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось зафиксировать решение')
    }
  }

  const handleStartCatalogTest = async (testItem: TestItem) => {
    const matchedActivity = EDUCATIONAL_ACTIVITIES.find((a) => a.slug === testItem.slug)
    if (matchedActivity) {
      setCurrentTab('exercises')
      void startExercise(matchedActivity)
      return
    }
    const syntheticActivity: Activity = {
      slug: testItem.slug,
      title: testItem.localizations[lang]?.title ?? testItem.localizations.en?.title ?? testItem.slug,
      description: testItem.localizations[lang]?.description ?? testItem.localizations.en?.description ?? 'Health screening exercise',
      kind: 'reflection',
    }
    setCurrentTab('exercises')
    void startExercise(syntheticActivity)
  }

  // Assistant
  const sendAssistantMessage = async (event: FormEvent) => {
    event.preventDefault()
    const text = assistantText.trim()
    if (!text) return
    const currentDialog = dialog.slice(-12)
    setDialog([...currentDialog, { role: 'user', text }])
    setAssistantText('')
    setAssistantActions([])
    try {
      const reply = await apiRequest<AssistantReply>('/assistant/message', {
        method: 'POST',
        body: JSON.stringify({ text, conversation: currentDialog }),
      })
      setDialog([...currentDialog, { role: 'user', text }, { role: 'assistant', text: reply.message }])
      setAssistantActions(reply.actions)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Не удалось связаться с ассистентом')
    }
  }

  const startVoiceInput = () => {
    type Recognition = {
      lang: string
      start: () => void
      onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void
      onerror: () => void
    }
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition
    if (!SpeechRec) {
      setMessage('Голосовой ввод не поддерживается данным браузером.')
      return
    }
    const recognition = new SpeechRec()
    recognition.lang = lang === 'ru' ? 'ru-RU' : lang === 'tj' ? 'tg-TG' : 'en-US'
    recognition.onresult = (event) => setAssistantText(event.results[0][0].transcript)
    recognition.onerror = () => setMessage('Не удалось распознать голосовую команду.')
    recognition.start()
  }

  const runAssistantAction = (action: AssistantAction) => {
    if (action.name === 'navigate_to_page' || action.name === 'scroll_to_section' || action.name === 'highlight_element') {
      window.location.hash = action.arguments.target
      return
    }
    if (action.name === 'open_test' || action.name === 'prepare_test_start') {
      const matched = EDUCATIONAL_ACTIVITIES.find((item) => item.slug === action.arguments.slug)
      if (matched) {
        setCurrentTab('exercises')
        void startExercise(matched)
      }
      return
    }
    setMessage('This assistant action is available when the corresponding screen is added.')
  }

  // Public Content Fetching
  useEffect(() => {
    if (currentTab === 'faq') {
      apiRequest<FaqItem[]>('/faq').then(setFaqs).catch(() => {})
    } else if (currentTab === 'knowledge') {
      apiRequest<KnowledgeArticle[]>('/knowledge').then(setArticles).catch(() => {})
    } else if (currentTab === 'support' && token) {
      apiRequest<SupportTicket[]>('/support/my-tickets').then(setMyTickets).catch(() => {})
    }
  }, [currentTab, token])

  const submitSupport = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await apiRequest('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ contact_email: supportEmail, subject: supportSubject, message: supportMessage }),
      })
      setSupportSubject('')
      setSupportMessage('')
      setMessage('Your support request was submitted. A support specialist will review it.')
      if (token) apiRequest<SupportTicket[]>('/support/my-tickets').then(setMyTickets).catch(() => {})
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unable to submit ticket')
    }
  }

  return (
    <main className="app-shell">
      {/* 1. SINGLE-ROW UNIFIED NAVBAR */}
      <header className="sihat-navbar" aria-label="Main Navigation Bar">
        <div className="navbar-container">
          {/* Brand Identity with single SVG mark (NO duplicate text bug!) */}
          <div
            className="brand-wrap"
            onClick={() => {
              setCurrentTab('home')
              setMobileMenuOpen(false)
            }}
            role="button"
            tabIndex={0}
            aria-label="SIHAT"
          >
            <img
              src="/sihat-mark.svg"
              alt="SIHAT Mark"
              className="brand-logo-img"
              onError={(e) => {
                ;(e.target as HTMLElement).style.display = 'none'
              }}
            />
            <div className="brand-text-block">
              <span className="brand-title">{t.brand}</span>
              <span className="brand-slogan">{t.slogan}</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="navbar-nav-links" aria-label="Desktop Navigation">
            <button
              type="button"
              className={'nav-link-btn' + (currentTab === 'home' ? ' active' : '')}
              onClick={() => setCurrentTab('home')}
            >
              {t.nav.home}
            </button>
            <button
              type="button"
              className={'nav-link-btn' + (currentTab === 'catalog' ? ' active' : '')}
              onClick={() => setCurrentTab('catalog')}
            >
              {lang === 'en' ? 'Catalog & Passports' : t.nav.catalog}
            </button>
            <button
              type="button"
              className={'nav-link-btn' + (currentTab === 'exercises' ? ' active' : '')}
              onClick={() => setCurrentTab('exercises')}
            >
              {lang === 'en' ? 'Educational Exercises' : t.nav.exercises}
            </button>
            {token && (
              <button
                type="button"
                className={'nav-link-btn' + (currentTab === 'history' ? ' active' : '')}
                onClick={() => setCurrentTab('history')}
              >
                {lang === 'en' ? 'My History & PDF' : t.nav.history}
              </button>
            )}
            <button
              type="button"
              className={'nav-link-btn' + (currentTab === 'faq' ? ' active' : '')}
              onClick={() => setCurrentTab('faq')}
            >
              {t.nav.faq}
            </button>
            <button
              type="button"
              className={'nav-link-btn' + (currentTab === 'knowledge' ? ' active' : '')}
              onClick={() => setCurrentTab('knowledge')}
            >
              {lang === 'en' ? 'Knowledge Base' : t.nav.knowledge}
            </button>
            <button
              type="button"
              className={'nav-link-btn' + (currentTab === 'support' ? ' active' : '')}
              onClick={() => setCurrentTab('support')}
            >
              {t.nav.support}
            </button>
            {token && profile?.role === 'admin' && (
              <button
                type="button"
                className={'nav-link-btn' + (currentTab === 'admin' ? ' active' : '')}
                onClick={() => setCurrentTab('admin')}
              >
                {t.nav.admin}
              </button>
            )}
          </nav>

          {/* Right Controls: Language, Theme, Auth & Mobile Hamburger */}
          <div className="navbar-actions">
            {/* Trilingual Pill */}
            <div className="lang-switcher" aria-label="Language selector">
              <button
                type="button"
                className={'lang-btn' + (lang === 'ru' ? ' active' : '')}
                onClick={() => setLang('ru')}
              >
                RU
              </button>
              <button
                type="button"
                className={'lang-btn' + (lang === 'tj' ? ' active' : '')}
                onClick={() => setLang('tj')}
              >
                TJ
              </button>
              <button
                type="button"
                className={'lang-btn' + (lang === 'en' ? ' active' : '')}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle light/dark theme"
            >
              {theme === 'light' ? `🌙 ${t.themeDark}` : `☀️ ${t.themeLight}`}
            </button>

            {/* Auth status or Sign In */}
            <div className="navbar-user-block">
              {token ? (
                <div className="user-logged-box">
                  <span className="user-email-tag">
                    {profile?.email ?? email} <span className="role-tag">{profile?.role ?? 'user'}</span>
                  </span>
                  <button type="button" className="quiet-button compact-btn" onClick={signOut}>
                    {t.nav.signOut}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary-emerald compact-btn"
                  onClick={() => setAuthModalOpen(true)}
                >
                  {t.nav.signIn} / {t.nav.signUp}
                </button>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.menu}
              aria-expanded={mobileMenuOpen}
            >
              <span className="hamburger-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer" role="dialog" aria-modal="true">
            <div className="mobile-drawer-links">
              <button
                type="button"
                className={'drawer-link-btn' + (currentTab === 'home' ? ' active' : '')}
                onClick={() => {
                  setCurrentTab('home')
                  setMobileMenuOpen(false)
                }}
              >
                {t.nav.home}
              </button>
              <button
                type="button"
                className={'drawer-link-btn' + (currentTab === 'catalog' ? ' active' : '')}
                onClick={() => {
                  setCurrentTab('catalog')
                  setMobileMenuOpen(false)
                }}
              >
                {lang === 'en' ? 'Catalog & Passports' : t.nav.catalog}
              </button>
              <button
                type="button"
                className={'drawer-link-btn' + (currentTab === 'exercises' ? ' active' : '')}
                onClick={() => {
                  setCurrentTab('exercises')
                  setMobileMenuOpen(false)
                }}
              >
                {lang === 'en' ? 'Educational Exercises' : t.nav.exercises}
              </button>
              {token && (
                <button
                  type="button"
                  className={'drawer-link-btn' + (currentTab === 'history' ? ' active' : '')}
                  onClick={() => {
                    setCurrentTab('history')
                    setMobileMenuOpen(false)
                  }}
                >
                  {lang === 'en' ? 'My History & PDF' : t.nav.history}
                </button>
              )}
              <button
                type="button"
                className={'drawer-link-btn' + (currentTab === 'faq' ? ' active' : '')}
                onClick={() => {
                  setCurrentTab('faq')
                  setMobileMenuOpen(false)
                }}
              >
                {t.nav.faq}
              </button>
              <button
                type="button"
                className={'drawer-link-btn' + (currentTab === 'knowledge' ? ' active' : '')}
                onClick={() => {
                  setCurrentTab('knowledge')
                  setMobileMenuOpen(false)
                }}
              >
                {lang === 'en' ? 'Knowledge Base' : t.nav.knowledge}
              </button>
              <button
                type="button"
                className={'drawer-link-btn' + (currentTab === 'support' ? ' active' : '')}
                onClick={() => {
                  setCurrentTab('support')
                  setMobileMenuOpen(false)
                }}
              >
                {t.nav.support}
              </button>
              {token && profile?.role === 'admin' && (
                <button
                  type="button"
                  className={'drawer-link-btn' + (currentTab === 'admin' ? ' active' : '')}
                  onClick={() => {
                    setCurrentTab('admin')
                    setMobileMenuOpen(false)
                  }}
                >
                  {t.nav.admin}
                </button>
              )}
            </div>

            <div className="mobile-drawer-footer">
              {!token && (
                <button
                  type="button"
                  className="btn-primary-emerald"
                  style={{ width: '100%', marginBottom: '12px' }}
                  onClick={() => {
                    setAuthModalOpen(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  {t.nav.signIn} / {t.nav.signUp}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global alert / message banner */}
      {message && (
        <div className="global-message-banner" role="alert">
          <span>{message}</span>
          <button type="button" className="banner-close-btn" onClick={() => setMessage('')} aria-label="Закрыть">
            ✕
          </button>
        </div>
      )}

      {/* 2. TAB: HOME / LANDING EXPERIENCE */}
      {currentTab === 'home' && (
        <LandingHero
          t={t}
          lang={lang}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenAssistant={() => setAssistantOpen(true)}
          onSearch={(q) => {
            setCatalogSearch(q)
            setCatalogCategory('all')
            setCurrentTab('catalog')
          }}
          onSelectCategory={(slug) => {
            setCatalogCategory(slug)
            setCatalogSearch('')
            setCurrentTab('catalog')
          }}
        />
      )}

      {/* 3. TAB: EDUCATIONAL EXERCISES */}
      {currentTab === 'exercises' && (
        <section className="exercises-view-section" aria-label="Educational exercises">
          {/* Completion View with Explicit Choice */}
          {completion ? (
            <section className="completion-card" aria-live="polite">
              <div className="eyebrow-pill">СЕССИЯ ЗАВЕРШЕНА</div>
              <h2>{lang === 'en' ? 'Exercise complete' : t.exercises.completedTitle}</h2>
              <p className="completion-outcome-text">
                {completion.result?.message ?? 'Your exercise response was recorded.'}
              </p>
              <p className="consent-text">
                {t.runner.consentExplain}
              </p>
              <div className="runner-actions">
                <button type="button" className="btn-primary-emerald" onClick={() => decideSave(true)}>
                  {lang === 'en' ? 'Save' : t.exercises.saveBtn}
                </button>
                <button type="button" className="secondary-button" onClick={() => decideSave(false)}>
                  {lang === 'en' ? 'Do not save' : t.exercises.doNotSaveBtn}
                </button>
              </div>
            </section>
          ) : attempt && selectedActivity ? (
            /* Active Runner Stage */
            <section className="runner-card active-runner" aria-live="polite">
              <div className="runner-heading">
                <div>
                  <p className="eyebrow">{selectedActivity.slug}</p>
                  <h2>{selectedActivity.title}</h2>
                  <p>{selectedActivity.description}</p>
                </div>
                <button type="button" className="quiet-button" onClick={discardExercise}>
                  {lang === 'en' ? 'Leave exercise' : t.exercises.leaveBtn}
                </button>
              </div>
              <ExercisePanel key={selectedActivity.slug} activity={selectedActivity} onReady={setReady} />
              <div className="runner-actions">
                <button type="button" className="secondary-button" onClick={() => respondExercise('skipped')}>
                  {lang === 'en' ? 'Skip exercise' : t.exercises.skipBtn}
                </button>
                <button
                  type="button"
                  className="btn-primary-emerald"
                  disabled={!ready}
                  onClick={() => respondExercise('completed')}
                >
                  {lang === 'en' ? 'Complete exercise' : t.exercises.completeBtn}
                </button>
              </div>
            </section>
          ) : (
            /* Exercise Catalog Showcase for both guests and authenticated users */
            <div className="exercises-directory-container">
              <div className="section-head-split">
                <div>
                  <div className="eyebrow-pill">ИНТЕРАКТИВНЫЕ МОДУЛИ</div>
                  <h2 className="section-title-large">{t.exercises.title}</h2>
                  <p className="section-subtitle">{t.exercises.subtitle}</p>
                </div>
                {token && (
                  <button type="button" className="quiet-button" onClick={signOut}>
                    {t.nav.signOut}
                  </button>
                )}
              </div>

              {/* Guest Authentication Card (satisfies Playwright tests & informs anonymous users) */}
              {!token && (
                <div className="guest-exercise-prompt-card">
                  <div className="prompt-left">
                    <span className="prompt-badge">🔐 RBAC Безопасность</span>
                    <h3 className="prompt-heading">{t.exercises.signInPrompt}</h3>
                    <p className="prompt-desc">{t.exercises.guestNotice}</p>
                  </div>

                  {/* Inline Quick Login Form (Preserves exact button label for Playwright tests!) */}
                  <form className="login-card inline-login" onSubmit={login}>
                    <label>
                      Email
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        placeholder="learner@example.com"
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="current-password"
                      />
                    </label>
                    <button type="submit" className="btn-primary-emerald">
                      Sign in to choose an exercise
                    </button>
                  </form>
                </div>
              )}

              {/* Full 15 Educational Activities Matrix */}
              <div className="activity-grid">
                {EDUCATIONAL_ACTIVITIES.map((act) => (
                  <article key={act.slug} className="exercise-card-tile">
                    <div className="card-top-row">
                      <span className={'badge-type badge-' + act.kind}>{act.kind}</span>
                      <span className="module-duration-pill">~2–3 мин</span>
                    </div>
                    <h3 className="exercise-tile-title">{act.title}</h3>
                    <p className="exercise-tile-desc">{act.description}</p>
                    <div className="exercise-tile-footer">
                      <button
                        type="button"
                        className="btn-primary-emerald compact-btn"
                        onClick={() => startExercise(act)}
                      >
                        Start exercise
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 4. TAB: CATALOG & METHODOLOGY PASSPORTS */}
      {currentTab === 'catalog' && (
        <CatalogView
          token={token}
          onStartTest={handleStartCatalogTest}
          t={t}
          lang={lang}
          initialQuery={catalogSearch}
          initialCategory={catalogCategory}
        />
      )}

      {/* 5. TAB: PRIVATE HISTORY & PDF */}
      {currentTab === 'history' && token && (
        <HistoryView t={t} lang={lang} />
      )}

      {/* 6. TAB: FAQ */}
      {currentTab === 'faq' && (
        <section className="content-card faq-section" aria-label="Frequently Asked Questions">
          <div className="section-head-split">
            <div>
              <div className="eyebrow-pill">СПРАВОЧНАЯ ИНФОРМАЦИЯ</div>
              <h2 className="section-title-large">{t.nav.faq}</h2>
              <p className="section-subtitle">Ответы на ключевые вопросы о методиках, приватности и точности калибровки SIHAT.</p>
            </div>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <article key={faq.id} className="faq-card">
                <h3 className="faq-question">{faq.question[lang] ?? faq.question.en ?? faq.question.ru}</h3>
                <p className="faq-answer">{faq.answer[lang] ?? faq.answer.en ?? faq.answer.ru}</p>
              </article>
            ))}
            {faqs.length === 0 && <p className="loading-state">Загрузка вопросов и ответов...</p>}
          </div>
        </section>
      )}

      {/* 7. TAB: KNOWLEDGE BASE */}
      {currentTab === 'knowledge' && (
        <section className="content-card knowledge-section" aria-label="Knowledge Base">
          <div className="section-head-split">
            <div>
              <div className="eyebrow-pill">НАУЧНАЯ БАЗА</div>
              <h2 className="section-title-large">{t.nav.knowledge}</h2>
              <p className="section-subtitle">Публикации, обоснования методик и стандарты психофизиологической оценки.</p>
            </div>
          </div>
          <div className="article-list">
            {articles.map((art) => (
              <article key={art.id} className="article-card">
                <span className="badge-type">{art.category}</span>
                <h3 className="article-title">{art.localizations[lang]?.title ?? art.localizations.en?.title ?? art.localizations.ru?.title}</h3>
                <p className="article-body">{art.localizations[lang]?.content ?? art.localizations.en?.content ?? art.localizations.ru?.content}</p>
              </article>
            ))}
            {articles.length === 0 && <p className="loading-state">Загрузка статей и стандартов...</p>}
          </div>
        </section>
      )}

      {/* 8. TAB: SUPPORT */}
      {currentTab === 'support' && (
        <section className="content-card support-section" aria-label="Support">
          <div className="section-head-split">
            <div>
              <div className="eyebrow-pill">СЛУЖБА ПОДДЕРЖКИ</div>
              <h2 className="section-title-large">{t.nav.support}</h2>
              <p className="section-subtitle">Задайте вопрос специалистам платформы по работе методик и техническим аспектам.</p>
            </div>
          </div>

          <form onSubmit={submitSupport} className="support-form-container">
            <div className="form-group">
              <label htmlFor="supp-email">Contact Email</label>
              <input
                id="supp-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="supp-subj">Subject</label>
              <input
                id="supp-subj"
                type="text"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                required
                minLength={3}
                maxLength={240}
                placeholder="Тема обращения..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="supp-msg">Message</label>
              <textarea
                id="supp-msg"
                rows={4}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                required
                minLength={10}
                maxLength={4000}
                placeholder="Опишите вопрос или предложение..."
              />
            </div>
            <button type="submit" className="btn-primary-emerald">
              Submit support ticket
            </button>
          </form>

          {myTickets.length > 0 && (
            <div className="user-tickets-wrapper" style={{ marginTop: '36px' }}>
              <h3>Ваши обращения</h3>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTickets.map((tk) => (
                      <tr key={tk.id}>
                        <td>{tk.subject}</td>
                        <td>
                          <span className={'status-badge ' + tk.status}>{tk.status}</span>
                        </td>
                        <td>{tk.admin_notes ?? 'Pending review'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 9. TAB: ADMIN CONSOLE */}
      {currentTab === 'admin' && profile?.role === 'admin' && (
        <AdminView onNotify={setMessage} t={t} lang={lang} />
      )}

      {/* Auth Modal for Sign in / Registration */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(p, tk) => {
          setProfile(p)
          setToken(tk)
          setApiToken(tk)
        }}
        onNotify={setMessage}
        t={t}
        lang={lang}
        resetToken={resetTokenFromUrl}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-brand-row">
          <div className="brand-wrap">
            <img src="/sihat-mark.svg" alt="SIHAT" className="brand-logo-img" />
            <div className="brand-text-block">
              <span className="brand-title">{t.brand}</span>
              <span className="brand-slogan">{t.slogan}</span>
            </div>
          </div>
          <div className="footer-slogan-motto">{t.tagline}</div>
        </div>

        <p className="footer-disclaimer">{t.disclaimer.text}</p>
        <div className="footer-meta">
          <span>© {new Date().getFullYear()} {t.brand}. {t.footer.rights}</span>
          <span>{t.footer.designedWithCare}</span>
        </div>
      </footer>

      {/* Gemini AI Floating Launcher & Slide-over Drawer */}
      <button
        type="button"
        className="assistant-toggle"
        aria-label="Ask SIHAT"
        aria-expanded={assistantOpen}
        onClick={() => {
          setAssistantOpen(!assistantOpen)
          window.location.hash = assistantOpen ? '' : '#assistant'
        }}
      >
        <span className="sparkle-dot" aria-hidden="true">✦</span>
        <span>{lang === 'en' ? 'Ask SIHAT' : t.nav.assistant}</span>
      </button>

      {assistantOpen && (
        <aside className="assistant-panel" aria-label="SIHAT assistant">
          <div className="assistant-panel-header">
            <div className="assistant-header-id">
              <span className="sparkle-dot" aria-hidden="true">✦</span>
              <div>
                <h3>SIHAT AI Navigator</h3>
                <span className="assistant-safe-status">Safe bounds active</span>
              </div>
            </div>
            <button
              type="button"
              className="quiet-button"
              onClick={() => {
                setAssistantOpen(false)
                window.location.hash = ''
              }}
            >
              ✕
            </button>
          </div>

          <p className="assistant-disclaimer-note">
            Этот ассистент помогает ориентироваться на платформе и подбирать скрининги. Он не ставит медицинских диагнозов и не назначает лечение. Диалог сохраняется только в текущей сессии браузера.
          </p>

          <div className="assistant-dialog" aria-live="polite">
            {dialog.length === 0 && (
              <div className="assistant-empty-prompt">
                <p>Задайте вопрос о самочувствии или подборе скрининга, например:</p>
                <button
                  type="button"
                  className="prompt-suggestion-pill"
                  onClick={() => setAssistantText('К вечеру двоится текст в редакторе кода и тяжело удерживать фокус. С чего начать проверку?')}
                >
                  «К вечеру двоится текст в редакторе...»
                </button>
              </div>
            )}
            {dialog.map((item, index) => (
              <div key={index} className={'assistant-bubble-wrap ' + item.role}>
                <div className={'chat-bubble assistant-' + item.role}>
                  <div className="bubble-role-label">{item.role === 'user' ? 'Вы' : 'SIHAT AI'}</div>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          {assistantActions.length > 0 && (
            <div className="assistant-actions-row">
              {assistantActions.map((action, index) => (
                <button
                  type="button"
                  key={action.name + index}
                  className="action-suggestion-pill"
                  onClick={() => runAssistantAction(action)}
                >
                  {action.requires_confirmation ? 'Confirm: ' : ''}{action.name.replaceAll('_', ' ')}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={sendAssistantMessage} className="assistant-input-form">
            <label>
              Message SIHAT assistant
              <textarea
                value={assistantText}
                onChange={(event) => setAssistantText(event.target.value)}
                placeholder="Напишите вопрос ИИ-навигатору..."
                maxLength={2000}
                rows={2}
              />
            </label>
            <div className="assistant-controls-row">
              <button type="submit" className="btn-primary-emerald compact-btn">
                Send
              </button>
              <button
                type="button"
                className="secondary-button compact-btn"
                onClick={startVoiceInput}
                title="Голосовой ввод"
              >
                🎤 Use voice input
              </button>
            </div>
          </form>
        </aside>
      )}
    </main>
  )
}

export default App
