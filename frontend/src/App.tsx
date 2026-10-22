import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { apiRequest, setApiToken } from './api'
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
  const [authModalOpen, setAuthModalOpen] = useState(false)

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
      const body = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(body.access_token)
      setApiToken(body.access_token)
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
    setToken('')
    setApiToken('')
    setProfile(null)
    setCompletion(null)
    setAttempt(null)
    setSelectedActivity(null)
    setCurrentTab('exercises')
    setMessage('You have signed out.')
  }

  const startExercise = async (act: Activity) => {
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
      setMessage(error instanceof Error ? error.message : 'Unable to start exercise')
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
      setMessage(error instanceof Error ? error.message : 'Unable to save this exercise')
    }
  }

  const discardExercise = async () => {
    if (attempt) {
      try {
        await apiRequest(`/attempts/${attempt.id}/discard`, { method: 'DELETE' })
      } catch {
        /* Local screen can close safely */
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
      setMessage(save ? 'Your exercise result was saved to your private history.' : 'Your temporary exercise result was deleted.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to record your choice')
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
      setMessage(error instanceof Error ? error.message : 'Unable to reach assistant')
    }
  }

  const startVoiceInput = () => {
    type Recognition = { lang: string; start: () => void; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void }
    const SpeechRec = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition
    if (!SpeechRec) {
      setMessage('Voice input is not available in this browser.')
      return
    }
    const recognition = new SpeechRec()
    recognition.lang = lang === 'ru' ? 'ru-RU' : 'en-US'
    recognition.onresult = (event) => setAssistantText(event.results[0][0].transcript)
    recognition.onerror = () => setMessage('Voice input could not be transcribed.')
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

  // Content fetching for public FAQ & Knowledge
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
      {/* Top Header Bar */}
      <header className="top-bar">
        <div className="brand-wrap" onClick={() => setCurrentTab('home')} role="button" tabIndex={0}>
          <img
            src="/sihat-logo.png"
            alt="SIHAT - Understand Your Health"
            className="brand-logo-img"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div className="brand-text-block">
            <span className="brand-title">{t.brand}</span>
            <span className="brand-slogan">{t.slogan}</span>
          </div>
        </div>

        <div className="top-bar-controls">
          {/* Trilingual Language Switcher */}
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

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle light/dark theme"
          >
            {theme === 'light' ? `🌙 ${t.themeDark}` : `☀️ ${t.themeLight}`}
          </button>

          {/* User Profile or Sign In Action */}
          <div className="user-badge">
            {token ? (
              <>
                <span className="user-email-label">
                  {profile?.email ?? email} <span className="role-tag">{profile?.role ?? 'user'}</span>
                </span>
                <button className="quiet-button" style={{ fontSize: '.82rem', padding: '5px 12px' }} onClick={signOut}>
                  {t.nav.signOut}
                </button>
              </>
            ) : (
              <button
                className="secondary-button"
                style={{ fontSize: '.85rem', padding: '6px 14px' }}
                onClick={() => setAuthModalOpen(true)}
              >
                {t.nav.signIn} / {t.nav.signUp}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="nav-tabs" aria-label="Main Navigation">
        <button
          className={'nav-tab' + (currentTab === 'home' ? ' active' : '')}
          onClick={() => setCurrentTab('home')}
        >
          {t.nav.home}
        </button>
        <button
          className={'nav-tab' + (currentTab === 'catalog' ? ' active' : '')}
          onClick={() => setCurrentTab('catalog')}
        >
          Catalog & Passports
        </button>
        <button
          className={'nav-tab' + (currentTab === 'exercises' ? ' active' : '')}
          onClick={() => setCurrentTab('exercises')}
        >
          Educational Exercises
        </button>
        {token && (
          <button
            className={'nav-tab' + (currentTab === 'history' ? ' active' : '')}
            onClick={() => setCurrentTab('history')}
          >
            My History & PDF
          </button>
        )}
        <button
          className={'nav-tab' + (currentTab === 'faq' ? ' active' : '')}
          onClick={() => setCurrentTab('faq')}
        >
          FAQ
        </button>
        <button
          className={'nav-tab' + (currentTab === 'knowledge' ? ' active' : '')}
          onClick={() => setCurrentTab('knowledge')}
        >
          Knowledge Base
        </button>
        <button
          className={'nav-tab' + (currentTab === 'support' ? ' active' : '')}
          onClick={() => setCurrentTab('support')}
        >
          Support
        </button>
        {token && profile?.role === 'admin' && (
          <button
            className={'nav-tab' + (currentTab === 'admin' ? ' active' : '')}
            onClick={() => setCurrentTab('admin')}
          >
            Admin Panel
          </button>
        )}
      </nav>

      {/* Tab: Home / Landing Experience */}
      {currentTab === 'home' && (
        <LandingHero
          t={t}
          lang={lang}
          onNavigate={(tab) => setCurrentTab(tab)}
          onOpenAssistant={() => setAssistantOpen(true)}
          onSearch={(q) => {
            setCatalogSearch(q)
            setCurrentTab('catalog')
          }}
        />
      )}

      {/* Tab: Exercises (Educational Runner) */}
      {currentTab === 'exercises' && (
        !token ? (
          <form className="login-card" onSubmit={login}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
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
            <button type="submit">Sign in to choose an exercise</button>
          </form>
        ) : completion ? (
          <section className="completion-card" aria-live="polite">
            <h2>Exercise complete</h2>
            <p>{completion.result?.message ?? 'Your exercise response was recorded.'}</p>
            <p>It is not a diagnosis or health result. Choose whether to save this result to your private history.</p>
            <div className="runner-actions">
              <button onClick={() => decideSave(true)}>Save</button>
              <button className="secondary-button" onClick={() => decideSave(false)}>Do not save</button>
            </div>
          </section>
        ) : attempt && selectedActivity ? (
          <section className="runner-card">
            <div className="runner-heading">
              <div>
                <p className="eyebrow">{selectedActivity.slug}</p>
                <h2>{selectedActivity.title}</h2>
                <p>{selectedActivity.description}</p>
              </div>
              <button className="quiet-button" onClick={discardExercise}>Leave exercise</button>
            </div>
            <ExercisePanel key={selectedActivity.slug} activity={selectedActivity} onReady={setReady} />
            <div className="runner-actions">
              <button className="secondary-button" onClick={() => respondExercise('skipped')}>Skip exercise</button>
              <button disabled={!ready} onClick={() => respondExercise('completed')}>Complete exercise</button>
            </div>
          </section>
        ) : (
          <section className="activity-list" aria-label="Educational exercises">
            <div className="section-heading">
              <h2>Choose an activity</h2>
              <button className="quiet-button" onClick={signOut}>{t.nav.signOut}</button>
            </div>
            <div className="activity-grid">
              {EDUCATIONAL_ACTIVITIES.map((act) => (
                <article key={act.slug}>
                  <p className="eyebrow">{act.kind}</p>
                  <h3>{act.title}</h3>
                  <p>{act.description}</p>
                  <button onClick={() => startExercise(act)}>Start exercise</button>
                </article>
              ))}
            </div>
          </section>
        )
      )}

      {/* Tab: Catalog & Passports */}
      {currentTab === 'catalog' && (
        <CatalogView
          token={token}
          onStartTest={handleStartCatalogTest}
          t={t}
          lang={lang}
          initialQuery={catalogSearch}
        />
      )}

      {/* Tab: Private History & PDF */}
      {currentTab === 'history' && token && (
        <HistoryView t={t} />
      )}

      {/* Tab: FAQ */}
      {currentTab === 'faq' && (
        <section className="content-card" aria-label="Frequently Asked Questions">
          <div className="section-heading"><h2>{t.nav.faq}</h2></div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <article key={faq.id} className="faq-card">
                <h3>{faq.question[lang] ?? faq.question.en ?? faq.question.ru}</h3>
                <p>{faq.answer[lang] ?? faq.answer.en ?? faq.answer.ru}</p>
              </article>
            ))}
            {faqs.length === 0 && <p>Loading frequently asked questions...</p>}
          </div>
        </section>
      )}

      {/* Tab: Knowledge Base */}
      {currentTab === 'knowledge' && (
        <section className="content-card" aria-label="Knowledge Base">
          <div className="section-heading"><h2>{t.nav.knowledge}</h2></div>
          <div className="article-list">
            {articles.map((art) => (
              <article key={art.id} className="article-card">
                <p className="eyebrow">{art.category}</p>
                <h3>{art.localizations[lang]?.title ?? art.localizations.en?.title ?? art.localizations.ru?.title}</h3>
                <p>{art.localizations[lang]?.content ?? art.localizations.en?.content ?? art.localizations.ru?.content}</p>
              </article>
            ))}
            {articles.length === 0 && <p>Loading articles and standards...</p>}
          </div>
        </section>
      )}

      {/* Tab: Support */}
      {currentTab === 'support' && (
        <section className="content-card" aria-label="Support">
          <div className="section-heading"><h2>{t.nav.support}</h2></div>
          <form onSubmit={submitSupport} style={{ display: 'grid', gap: '14px', maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
            <label>Contact Email<input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required /></label>
            <label>Subject<input type="text" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required minLength={3} maxLength={240} /></label>
            <label>Message<textarea rows={4} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required minLength={10} maxLength={4000} /></label>
            <button type="submit">Submit support ticket</button>
          </form>
          {myTickets.length > 0 && (
            <div className="admin-section" style={{ marginTop: '28px' }}>
              <h3>Your Submitted Tickets</h3>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Subject</th><th>Status</th><th>Notes</th></tr></thead>
                  <tbody>
                    {myTickets.map((tk) => (
                      <tr key={tk.id}><td>{tk.subject}</td><td><strong>{tk.status}</strong></td><td>{tk.admin_notes ?? 'Pending review'}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab: Admin Panel */}
      {currentTab === 'admin' && profile?.role === 'admin' && (
        <AdminView onNotify={setMessage} />
      )}

      {/* Auth Modal for Sign in / Registration */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(p, tk) => { setProfile(p); setToken(tk); setApiToken(tk) }}
        onNotify={setMessage}
      />

      {/* Global alert / message banner */}
      {message && <p className="message" role="alert">{message}</p>}

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-slogan">{t.slogan}</div>
        <p className="footer-disclaimer">{t.disclaimer.text}</p>
        <div className="footer-meta">
          © {new Date().getFullYear()} {t.brand}. {t.footer.rights} {t.footer.designedWithCare}
        </div>
      </footer>

      {/* Assistant Floating Toggle & Drawer */}
      {token && (
        <>
          <button
            className="assistant-toggle"
            aria-label="Ask SIHAT"
            aria-expanded={assistantOpen}
            onClick={() => {
              setAssistantOpen(!assistantOpen)
              window.location.hash = '#assistant'
            }}
          >
            {t.nav.assistant}
          </button>
          {assistantOpen && (
            <aside className="assistant-panel" aria-label="SIHAT assistant">
              <div className="section-heading">
                <h2>SIHAT assistant</h2>
                <button className="quiet-button" onClick={() => setAssistantOpen(false)}>Close</button>
              </div>
              <p className="exercise-instruction">
                This assistant explains the platform and navigation. It does not diagnose or prescribe treatment.
                Your dialog is kept only in this browser session.
              </p>
              <div className="assistant-dialog" aria-live="polite">
                {dialog.map((item, index) => (
                  <p key={index} className={'assistant-' + item.role}>{item.text}</p>
                ))}
              </div>
              {assistantActions.map((action, index) => (
                <button key={action.name + index} className="secondary-button" onClick={() => runAssistantAction(action)}>
                  {action.requires_confirmation ? 'Confirm: ' : ''}{action.name.replaceAll('_', ' ')}
                </button>
              ))}
              <form onSubmit={sendAssistantMessage}>
                <label>
                  Message SIHAT assistant
                  <textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} maxLength={2000} />
                </label>
                <div className="runner-actions">
                  <button type="submit">Send</button>
                  <button type="button" className="secondary-button" onClick={startVoiceInput}>Use voice input</button>
                </div>
              </form>
            </aside>
          )}
        </>
      )}
    </main>
  )
}

export default App
