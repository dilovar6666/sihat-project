import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import { apiRequest, setApiToken } from './api'
import { AdminView } from './components/AdminView'
import { AuthModal } from './components/AuthModal'
import { CatalogView } from './components/CatalogView'
import { HistoryView } from './components/HistoryView'
import { EDUCATIONAL_ACTIVITIES, ExercisePanel } from './components/RunnerView'
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentTab, setCurrentTab] = useState<'exercises' | 'catalog' | 'history' | 'faq' | 'knowledge' | 'support' | 'admin'>('exercises')
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
      title: testItem.localizations.en?.title ?? testItem.slug,
      description: testItem.localizations.en?.description ?? 'Health screening exercise',
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
    recognition.lang = 'en-US'
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
        <a href="#home" className="brand-link" onClick={() => setCurrentTab('exercises')}>
          <span>✦</span> SIHAT <span style={{ fontSize: '.8rem', color: '#638477', fontWeight: 500 }}>Understand Your Health</span>
        </a>
        <div className="user-badge">
          {token ? (
            <>
              <span>{profile?.email ?? email} ({profile?.role ?? 'user'})</span>
              <button className="quiet-button" style={{ fontSize: '.82rem', padding: '4px 10px' }} onClick={signOut}>
                Sign Out
              </button>
            </>
          ) : (
            <button className="secondary-button" style={{ fontSize: '.85rem', padding: '6px 14px' }} onClick={() => setAuthModalOpen(true)}>
              Sign In / Register
            </button>
          )}
        </div>
      </header>

      {/* Hero Heading */}
      <header className="app-header">
        <p className="eyebrow">SIHAT HealthTech Platform</p>
        <h1>Understand Your Health</h1>
        <p className="lede">
          Bounded screening questionnaires, educational digital exercises, and verifiable methodology passports.
          SIHAT never diagnoses conditions or prescribes treatment.
        </p>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="nav-tabs" aria-label="Main Navigation">
        <button className={'nav-tab' + (currentTab === 'exercises' ? ' active' : '')} onClick={() => setCurrentTab('exercises')}>
          Exercises
        </button>
        <button className={'nav-tab' + (currentTab === 'catalog' ? ' active' : '')} onClick={() => setCurrentTab('catalog')}>
          Catalog & Passports
        </button>
        {token && (
          <button className={'nav-tab' + (currentTab === 'history' ? ' active' : '')} onClick={() => setCurrentTab('history')}>
            My History & PDF
          </button>
        )}
        <button className={'nav-tab' + (currentTab === 'faq' ? ' active' : '')} onClick={() => setCurrentTab('faq')}>
          FAQ
        </button>
        <button className={'nav-tab' + (currentTab === 'knowledge' ? ' active' : '')} onClick={() => setCurrentTab('knowledge')}>
          Knowledge Base
        </button>
        <button className={'nav-tab' + (currentTab === 'support' ? ' active' : '')} onClick={() => setCurrentTab('support')}>
          Support
        </button>
        {token && profile?.role === 'admin' && (
          <button className={'nav-tab' + (currentTab === 'admin' ? ' active' : '')} onClick={() => setCurrentTab('admin')}>
            Admin Panel
          </button>
        )}
      </nav>

      {/* Tab: Exercises (Default Runner) */}
      {currentTab === 'exercises' && (
        !token ? (
          <form className="login-card" onSubmit={login}>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label>
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
              <button className="quiet-button" onClick={signOut}>Sign out</button>
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
        <CatalogView token={token} onStartTest={handleStartCatalogTest} />
      )}

      {/* Tab: Private History & PDF */}
      {currentTab === 'history' && token && (
        <HistoryView />
      )}

      {/* Tab: FAQ */}
      {currentTab === 'faq' && (
        <section className="content-card" aria-label="Frequently Asked Questions">
          <div className="section-heading"><h2>Frequently Asked Questions</h2></div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <article key={faq.id} className="faq-card">
                <h3>{faq.question.en ?? faq.question.ru}</h3>
                <p>{faq.answer.en ?? faq.answer.ru}</p>
              </article>
            ))}
            {faqs.length === 0 && <p>Loading frequently asked questions...</p>}
          </div>
        </section>
      )}

      {/* Tab: Knowledge Base */}
      {currentTab === 'knowledge' && (
        <section className="content-card" aria-label="Knowledge Base">
          <div className="section-heading"><h2>Knowledge Base & Standards</h2></div>
          <div className="article-list">
            {articles.map((art) => (
              <article key={art.id} className="article-card">
                <p className="eyebrow">{art.category}</p>
                <h3>{art.localizations.en?.title ?? art.localizations.ru?.title}</h3>
                <p>{art.localizations.en?.content ?? art.localizations.ru?.content}</p>
              </article>
            ))}
            {articles.length === 0 && <p>Loading articles and standards...</p>}
          </div>
        </section>
      )}

      {/* Tab: Support */}
      {currentTab === 'support' && (
        <section className="content-card" aria-label="Support">
          <div className="section-heading"><h2>Contact Support</h2></div>
          <form onSubmit={submitSupport} style={{ display: 'grid', gap: '14px', maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
            <label>Contact Email<input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required /></label>
            <label>Subject<input type="text" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required minLength={3} maxLength={240} /></label>
            <label>Message<textarea rows={4} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required minLength={10} maxLength={4000} /></label>
            <button type="submit">Submit support ticket</button>
          </form>
          {myTickets.length > 0 && (
            <div className="admin-section">
              <h3>Your Submitted Tickets</h3>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Subject</th><th>Status</th><th>Notes</th></tr></thead>
                  <tbody>
                    {myTickets.map((t) => (
                      <tr key={t.id}><td>{t.subject}</td><td><strong>{t.status}</strong></td><td>{t.admin_notes ?? 'Pending review'}</td></tr>
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
        onLoginSuccess={(p, t) => { setProfile(p); setToken(t); setApiToken(t) }}
        onNotify={setMessage}
      />

      {/* Global alert / message banner */}
      {message && <p className="message" role="alert">{message}</p>}

      {/* Assistant Floating Toggle & Drawer */}
      {token && (
        <>
          <button className="assistant-toggle" aria-expanded={assistantOpen} onClick={() => { setAssistantOpen(!assistantOpen); window.location.hash = '#assistant' }}>
            Ask SIHAT
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
