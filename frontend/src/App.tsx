import { useEffect, useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import './App.css'

type Question = { id: string }
type Attempt = { id: string; current_question: Question | null }
type Completion = { id: string; result?: { message?: string } }
type DialogMessage = { role: 'user' | 'assistant'; text: string }
type AssistantAction = { name: string; arguments: Record<string, string>; requires_confirmation?: boolean }
type AssistantReply = { message: string; actions: AssistantAction[]; provider_available: boolean }
type ActivityKind = 'visual' | 'audio' | 'memory' | 'attention' | 'reflection' | 'reaction' | 'pointer' | 'processing'
type Activity = { slug: string; title: string; description: string; kind: ActivityKind }

type FaqItem = { id: string; slug: string; category: string; question: Record<string, string>; answer: Record<string, string> }
type KnowledgeArticle = { id: string; slug: string; category: string; localizations: Record<string, { title: string; summary?: string; content?: string }> }
type SupportTicket = { id: string; contact_email: string; subject: string; message: string; status: string; admin_notes?: string }
type AdminDashboard = {
  total_users: number
  users_by_age_group: Record<string, number>
  active_users: number
  inactive_users: number
  total_categories: number
  tests_by_status: Record<string, number>
  tests_by_type: Record<string, number>
  total_completed_attempts: number
  total_saved_results: number
  tickets_by_status: Record<string, number>
}
type AdminUser = { id: string; email: string; full_name: string; role: string; age_group: string; is_active: boolean }
type AdminTest = { id: string; slug: string; type: string; status: string; guest_allowed: boolean; min_age: number }

const api = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
const activities: Activity[] = [
  { slug: 'contrast-sensitivity', title: 'Contrast choices', description: 'Compare subtle light and dark patterns.', kind: 'visual' },
  { slug: 'color-hue-discrimination', title: 'Color choices', description: 'Match a color to its closest shade.', kind: 'visual' },
  { slug: 'visual-perception', title: 'Visual perception', description: 'Find the matching shape.', kind: 'visual' },
  { slug: 'sound-discrimination', title: 'Sound discrimination', description: 'Use sample controls to compare two tones.', kind: 'audio' },
  { slug: 'speech-in-noise', title: 'Speech in noise', description: 'Try a spoken-sample placeholder at a comfortable volume.', kind: 'audio' },
  { slug: 'short-term-memory', title: 'Short-term memory', description: 'Remember a short symbol sequence.', kind: 'memory' },
  { slug: 'visual-memory', title: 'Visual memory', description: 'Recall the cards that were shown.', kind: 'memory' },
  { slug: 'attention-concentration', title: 'Attention concentration', description: 'Select targets in a small field.', kind: 'attention' },
  { slug: 'attention-switching', title: 'Attention switching', description: 'Apply a changing sorting rule.', kind: 'attention' },
  { slug: 'emotional-wellbeing', title: 'Emotional wellbeing', description: 'Take a private moment for self-reflection.', kind: 'reflection' },
  { slug: 'reaction-speed', title: 'Reaction speed', description: 'Respond when the target appears.', kind: 'reaction' },
  { slug: 'mouse-eye-coordination', title: 'Pointer coordination', description: 'Move to and select the target.', kind: 'pointer' },
  { slug: 'information-processing-speed', title: 'Information processing', description: 'Make a quick visual match.', kind: 'processing' },
  { slug: 'physical-wellbeing', title: 'Physical wellbeing', description: 'Reflect privately on physical comfort today.', kind: 'reflection' },
  { slug: 'daily-activity', title: 'Daily activity', description: 'Reflect privately on a daily activity.', kind: 'reflection' },
]

function ExercisePanel({ activity, onReady }: { activity: Activity; onReady: (value: boolean) => void }) {
  const [notice, setNotice] = useState('')
  const [sequenceVisible, setSequenceVisible] = useState(false)
  const [sequence, setSequence] = useState<string[]>([])
  const [targets, setTargets] = useState<number[]>([])
  const [reaction, setReaction] = useState<'idle' | 'waiting' | 'go' | 'done'>('idle')
  const [startedAt, setStartedAt] = useState(0)
  const [pointer, setPointer] = useState({ left: 52, top: 48 })
  const symbols = ['circle', 'triangle', 'square']
  const setComplete = (text: string) => { setNotice(text); onReady(true) }
  const startReaction = () => {
    setReaction('waiting')
    onReady(false)
    window.setTimeout(() => { setStartedAt(performance.now()); setReaction('go') }, 700 + Math.random() * 900)
  }
  const hitTarget = (event: ReactPointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100
    if (Math.hypot(x - pointer.left, y - pointer.top) < 11) setComplete('Target selected. You may continue.')
    else { setNotice('Try selecting closer to the target.'); setPointer({ left: 20 + Math.random() * 60, top: 20 + Math.random() * 60 }) }
  }

  let content: ReactNode
  if (activity.kind === 'visual') {
    const values = activity.slug === 'color-hue-discrimination' ? ['#80b8d8', '#78a9da', '#6fa1d5'] : activity.slug === 'visual-perception' ? ['circle', 'diamond', 'square'] : ['light', 'medium', 'dark']
    content = <><p className="exercise-instruction">Choose the option that feels most similar to the sample. This activity has no clinical meaning.</p><div className={'choice-row ' + activity.slug}>{values.map((value, index) => <button className="visual-choice" key={value} style={activity.slug === 'color-hue-discrimination' ? { background: value } : undefined} onClick={() => setComplete('Choice ' + (index + 1) + ' selected locally. You may continue.')}>{activity.slug === 'color-hue-discrimination' ? <span className="sr-only">Color choice {index + 1}</span> : value}</button>)}</div></>
  } else if (activity.kind === 'audio') {
    content = <><p className="exercise-instruction">These controls are asset-free placeholders. No protected or licensed audio is included.</p><div className="audio-controls"><button onClick={() => setNotice('Sample A placeholder selected.')}>Play sample A</button><button onClick={() => setNotice('Sample B placeholder selected.')}>Play sample B</button></div><button className="secondary-button" onClick={() => setComplete('Comparison noted locally. You may continue.')}>I compared the samples</button></>
  } else if (activity.kind === 'memory' && activity.slug === 'short-term-memory') {
    const addSymbol = (symbol: string) => { const next = [...sequence, symbol]; setSequence(next); if (next.length === symbols.length) setComplete('Sequence recorded locally. You may continue.') }
    content = <><p className="exercise-instruction">Show the sequence, then enter the same three symbols.</p><button onClick={() => { setSequence([]); setSequenceVisible(true); onReady(false); window.setTimeout(() => setSequenceVisible(false), 1400) }}>Show sequence</button><div className="memory-display">{sequenceVisible ? symbols.join(' - ') : sequence.length ? sequence.join(' - ') : 'Ready'}</div>{!sequenceVisible && <div className="symbol-row">{symbols.map((symbol) => <button key={symbol} disabled={sequence.length === symbols.length} onClick={() => addSymbol(symbol)}>{symbol}</button>)}</div>}</>
  } else if (activity.kind === 'memory') {
    content = <><p className="exercise-instruction">Show the cards, hide them, then mark the activity complete when you have recalled them.</p><button onClick={() => { setSequenceVisible(!sequenceVisible); onReady(false) }}>{sequenceVisible ? 'Hide cards' : 'Show cards'}</button>{sequenceVisible ? <div className="memory-cards"><span>sun</span><span>leaf</span><span>moon</span></div> : <button className="secondary-button" onClick={() => setComplete('Recall activity completed locally. You may continue.')}>I recalled the cards</button>}</>
  } else if (activity.kind === 'attention' && activity.slug === 'attention-concentration') {
    const cells = ['target', 'x', 'target', 'triangle', 'x', 'square', 'target', 'triangle', 'target']
    const selectTarget = (cell: string, index: number) => {
      if (cell !== 'target') { setNotice('That is not a target. Try another cell.'); return }
      const next = [...new Set([...targets, index])]
      setTargets(next)
      if (next.length === 4) setComplete('All targets selected. You may continue.')
    }
    content = <><p className="exercise-instruction">Select all four target cells.</p><div className="target-grid">{cells.map((cell, index) => <button className={targets.includes(index) ? 'selected' : ''} key={cell + index} onClick={() => selectTarget(cell, index)}>{cell}</button>)}</div></>
  } else if (activity.kind === 'attention') {
    content = <><p className="exercise-instruction">Pick a matching rule, switch the rule, then try again.</p><div className="symbol-row"><button onClick={() => setComplete('Rule choice recorded locally. You may continue.')}>Blue circle</button><button onClick={() => setComplete('Rule choice recorded locally. You may continue.')}>Blue square</button><button onClick={() => setComplete('Rule choice recorded locally. You may continue.')}>Orange square</button></div><button className="secondary-button" onClick={() => setNotice('Rule switched. Choose again if you like.')}>Switch rule</button></>
  } else if (activity.kind === 'reflection') {
    const prompt = activity.slug === 'emotional-wellbeing' ? 'What would feel supportive right now?' : activity.slug === 'physical-wellbeing' ? 'What would help you feel comfortable today?' : 'What is one activity you noticed today?'
    content = <><label htmlFor="reflection">{prompt}</label><textarea id="reflection" rows={4} placeholder="Write for yourself; this note stays in your browser." onChange={(event) => onReady(event.target.value.trim().length > 0)} /><button className="secondary-button" onClick={() => setComplete('Private reflection completed. You may continue.')}>Mark reflection complete</button></>
  } else if (activity.kind === 'reaction') {
    content = <><p className="exercise-instruction">Start, then respond only when the target changes.</p>{reaction === 'idle' && <button onClick={startReaction}>Start reaction timing</button>}{reaction === 'waiting' && <button className="reaction waiting" disabled>Wait</button>}{reaction === 'go' && <button className="reaction go" onClick={() => { const elapsed = Math.round(performance.now() - startedAt); setReaction('done'); setComplete('Response captured locally after ' + elapsed + ' ms. It is not an assessment.') }}>Respond now</button>}{reaction === 'done' && <button className="secondary-button" onClick={startReaction}>Try again</button>}</>
  } else if (activity.kind === 'pointer') {
    content = <><p className="exercise-instruction">Select the moving circle. This checks browser interaction only, not a health measure.</p><div className="pointer-area" onPointerDown={hitTarget} role="application" aria-label="Pointer target area"><span className="pointer-target" style={{ left: pointer.left + '%', top: pointer.top + '%' }} /></div></>
  } else {
    content = <><p className="exercise-instruction">Which pair matches exactly?</p><div className="symbol-row"><button onClick={() => setNotice('Try comparing the order again.')}>7 - 4 - 9 / 7 - 9 - 4</button><button onClick={() => setComplete('Match selected locally. You may continue.')}>3 - 8 - 2 / 3 - 8 - 2</button></div></>
  }
  return <div className="exercise-panel">{content}{notice && <p className="exercise-notice" aria-live="polite">{notice}</p>}</div>
}

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user')
  const [currentTab, setCurrentTab] = useState<'exercises' | 'faq' | 'knowledge' | 'support' | 'admin'>('exercises')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [completion, setCompletion] = useState<Completion | null>(null)
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

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([])
  const [adminTests, setAdminTests] = useState<AdminTest[]>([])

  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(api + path, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...init.headers } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Request failed')
    return body
  }

  const login = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const body = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setToken(body.access_token)
      setMessage('')
      request('/me/profile', { headers: { Authorization: 'Bearer ' + body.access_token } })
        .then((profile) => setUserRole(profile.role === 'admin' ? 'admin' : 'user'))
        .catch(() => setUserRole('user'))
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in') }
  }

  const start = async (activity: Activity) => {
    try { const next = await request('/attempts/start', { method: 'POST', body: JSON.stringify({ test_slug: activity.slug }) }) as Attempt; setAttempt(next); setSelectedActivity(activity); setReady(false); setMessage('') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to start the exercise') }
  }

  const respond = async (answer: 'completed' | 'skipped') => {
    if (!attempt?.current_question) return
    try {
      const advanced = await request('/attempts/' + attempt.id + '/answer', { method: 'POST', body: JSON.stringify({ question_id: attempt.current_question.id, answer }) }) as Attempt
      if (advanced.current_question) { setAttempt(advanced); return }
      const finished = await request('/attempts/' + attempt.id + '/complete', { method: 'POST' }) as Completion
      setCompletion(finished); setAttempt(null); setSelectedActivity(null); setReady(false)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save this exercise') }
  }

  const discard = async () => {
    if (attempt) { try { await request('/attempts/' + attempt.id + '/discard', { method: 'DELETE' }) } catch { /* Local screen can still safely close. */ } }
    setAttempt(null); setSelectedActivity(null); setReady(false)
  }

  const decideSave = async (save: boolean) => {
    if (!completion) return
    try {
      await request('/attempts/' + completion.id + (save ? '/save' : '/do-not-save'), { method: 'POST' })
      setCompletion(null)
      setMessage(save ? 'Your exercise result was saved to your private history.' : 'Your temporary exercise result was deleted.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to record your choice') }
  }

  const sendAssistantMessage = async (event: FormEvent) => {
    event.preventDefault()
    const text = assistantText.trim()
    if (!text) return
    const currentDialog = dialog.slice(-12)
    setDialog([...currentDialog, { role: 'user', text }])
    setAssistantText('')
    setAssistantActions([])
    try {
      const reply = await request('/assistant/message', { method: 'POST', body: JSON.stringify({ text, conversation: currentDialog }) }) as AssistantReply
      setDialog([...currentDialog, { role: 'user', text }, { role: 'assistant', text: reply.message }])
      setAssistantActions(reply.actions)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to reach the assistant') }
  }

  const startVoiceInput = () => {
    type Recognition = { lang: string; start: () => void; onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void }
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition
    if (!SpeechRecognition) { setMessage('Voice input is not available in this browser.'); return }
    const recognition = new SpeechRecognition()
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
      const activity = activities.find((item) => item.slug === action.arguments.slug)
      if (activity) {
        setCurrentTab('exercises')
        void start(activity)
      }
      return
    }
    setMessage('This assistant action is available when the corresponding screen is added.')
  }

  // Load FAQ & Knowledge when tabs opened
  useEffect(() => {
    if (currentTab === 'faq') {
      request('/faq').then(setFaqs).catch(() => {})
    } else if (currentTab === 'knowledge') {
      request('/knowledge').then(setArticles).catch(() => {})
    } else if (currentTab === 'support' && token) {
      request('/support/my-tickets').then(setMyTickets).catch(() => {})
    } else if (currentTab === 'admin' && userRole === 'admin') {
      request('/admin/dashboard').then(setDashboard).catch(() => {})
      request('/admin/users').then(setAdminUsers).catch(() => {})
      request('/admin/support/tickets').then(setAdminTickets).catch(() => {})
      request('/admin/tests').then(setAdminTests).catch(() => {})
    }
  }, [currentTab, token, userRole])

  const submitSupportTicket = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await request('/support/tickets', {
        method: 'POST',
        body: JSON.stringify({ contact_email: supportEmail, subject: supportSubject, message: supportMessage }),
      })
      setSupportSubject('')
      setSupportMessage('')
      setMessage('Your support request was submitted. A support specialist will review it.')
      if (token) request('/support/my-tickets').then(setMyTickets).catch(() => {})
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit support ticket')
    }
  }

  const toggleUserActive = async (targetUser: AdminUser) => {
    try {
      const updated = await request('/admin/users/' + targetUser.id, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !targetUser.is_active }),
      }) as AdminUser
      setAdminUsers(adminUsers.map((u) => (u.id === updated.id ? updated : u)))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update user')
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updated = await request('/admin/support/tickets/' + ticketId, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }) as SupportTicket
      setAdminTickets(adminTickets.map((t) => (t.id === updated.id ? updated : t)))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update ticket')
    }
  }

  return <main className="app-shell">
    <header className="app-header">
      <p className="eyebrow">SIHAT HealthTech Platform</p>
      <h1>Understand Your Health</h1>
      <p className="lede">Non-diagnostic questionnaires, educational exercises, and verifiable methodology passport standards.</p>
    </header>

    <nav className="nav-tabs" aria-label="Main Navigation">
      <button className={'nav-tab' + (currentTab === 'exercises' ? ' active' : '')} onClick={() => setCurrentTab('exercises')}>Exercises</button>
      <button className={'nav-tab' + (currentTab === 'faq' ? ' active' : '')} onClick={() => setCurrentTab('faq')}>FAQ</button>
      <button className={'nav-tab' + (currentTab === 'knowledge' ? ' active' : '')} onClick={() => setCurrentTab('knowledge')}>Knowledge Base</button>
      <button className={'nav-tab' + (currentTab === 'support' ? ' active' : '')} onClick={() => setCurrentTab('support')}>Support</button>
      {token && userRole === 'admin' && (
        <button className={'nav-tab' + (currentTab === 'admin' ? ' active' : '')} onClick={() => setCurrentTab('admin')}>Admin Panel</button>
      )}
    </nav>

    {currentTab === 'exercises' && (
      !token ? <form className="login-card" onSubmit={login}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label><button type="submit">Sign in to choose an exercise</button></form> : completion ? <section className="completion-card" aria-live="polite"><h2>Exercise complete</h2><p>{completion.result?.message ?? 'Your exercise response was recorded.'}</p><p>It is not a diagnosis or health result. Choose whether to save this result to your private history.</p><div className="runner-actions"><button onClick={() => decideSave(true)}>Save</button><button className="secondary-button" onClick={() => decideSave(false)}>Do not save</button></div></section> : attempt && selectedActivity ? <section className="runner-card"><div className="runner-heading"><div><p className="eyebrow">{selectedActivity.slug}</p><h2>{selectedActivity.title}</h2><p>{selectedActivity.description}</p></div><button className="quiet-button" onClick={discard}>Leave exercise</button></div><ExercisePanel key={selectedActivity.slug} activity={selectedActivity} onReady={setReady} /><div className="runner-actions"><button className="secondary-button" onClick={() => respond('skipped')}>Skip exercise</button><button disabled={!ready} onClick={() => respond('completed')}>Complete exercise</button></div></section> : <section className="activity-list" aria-label="Educational exercises"><div className="section-heading"><h2>Choose an activity</h2><button className="quiet-button" onClick={() => { setToken(''); setCompletion(null); setUserRole('user') }}>Sign out</button></div><div className="activity-grid">{activities.map((activity) => <article key={activity.slug}><p className="eyebrow">{activity.kind}</p><h3>{activity.title}</h3><p>{activity.description}</p><button onClick={() => start(activity)}>Start exercise</button></article>)}</div></section>
    )}

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

    {currentTab === 'support' && (
      <section className="content-card" aria-label="Support">
        <div className="section-heading"><h2>Contact Support</h2></div>
        <form onSubmit={submitSupportTicket} style={{ display: 'grid', gap: '14px', maxWidth: '480px', margin: '0 auto' }}>
          <label>Contact Email<input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required /></label>
          <label>Subject<input type="text" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required minLength={3} maxLength={240} /></label>
          <label>Message<textarea rows={4} value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} required minLength={10} maxLength={4000} /></label>
          <button type="submit">Submit support ticket</button>
        </form>
        {myTickets.length > 0 && (
          <div className="admin-section">
            <h3>Your Recent Tickets</h3>
            <div className="table-wrap">
              <table className="admin-table">
                <thead><tr><th>Subject</th><th>Status</th><th>Notes</th></tr></thead>
                <tbody>
                  {myTickets.map((t) => (
                    <tr key={t.id}><td>{t.subject}</td><td><strong>{t.status}</strong></td><td>{t.admin_notes ?? 'In queue'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    )}

    {currentTab === 'admin' && userRole === 'admin' && (
      <section className="content-card" aria-label="Administration">
        <div className="section-heading"><h2>Administrative Dashboard</h2></div>
        {dashboard && (
          <div className="stat-grid">
            <div className="stat-box"><p className="stat-value">{dashboard.total_users}</p><p className="stat-label">Total Users</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.active_users}</p><p className="stat-label">Active Users</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.total_categories}</p><p className="stat-label">Categories</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.total_completed_attempts}</p><p className="stat-label">Completed Attempts</p></div>
            <div className="stat-box"><p className="stat-value">{dashboard.total_saved_results}</p><p className="stat-label">Saved Results</p></div>
          </div>
        )}

        <div className="admin-section">
          <h3>User Management</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Email</th><th>Role</th><th>Age</th><th>Active</th><th>Action</th></tr></thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td><td>{u.role}</td><td>{u.age_group}</td><td>{u.is_active ? 'Yes' : 'No'}</td>
                    <td><button className="quiet-button" onClick={() => toggleUserActive(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3>Support Inquiries</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Contact</th><th>Subject</th><th>Status</th><th>Change</th></tr></thead>
              <tbody>
                {adminTickets.map((t) => (
                  <tr key={t.id}>
                    <td>{t.contact_email}</td><td>{t.subject}</td><td><strong>{t.status}</strong></td>
                    <td>
                      <select value={t.status} onChange={(e) => updateTicketStatus(t.id, e.target.value)}>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-section">
          <h3>Catalog Tests</h3>
          <div className="table-wrap">
            <table className="admin-table">
              <thead><tr><th>Slug</th><th>Type</th><th>Status</th><th>Min Age</th></tr></thead>
              <tbody>
                {adminTests.map((t) => (
                  <tr key={t.id}>
                    <td>{t.slug}</td><td>{t.type}</td><td><strong>{t.status}</strong></td><td>{t.min_age}+</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    )}

    {message && <p className="message" role="alert">{message}</p>}
    {token && <><button className="assistant-toggle" aria-expanded={assistantOpen} onClick={() => { setAssistantOpen(!assistantOpen); window.location.hash = '#assistant' }}>Ask SIHAT</button>{assistantOpen && <aside className="assistant-panel" aria-label="SIHAT assistant"><div className="section-heading"><h2>SIHAT assistant</h2><button className="quiet-button" onClick={() => setAssistantOpen(false)}>Close</button></div><p className="exercise-instruction">This assistant explains the platform and navigation. It does not diagnose or prescribe treatment. Your dialog is kept only in this browser session.</p><div className="assistant-dialog" aria-live="polite">{dialog.map((item, index) => <p key={index} className={'assistant-' + item.role}>{item.text}</p>)}</div>{assistantActions.map((action, index) => <button key={action.name + index} className="secondary-button" onClick={() => runAssistantAction(action)}>{action.requires_confirmation ? 'Confirm: ' : ''}{action.name.replaceAll('_', ' ')}</button>)}<form onSubmit={sendAssistantMessage}><label>Message SIHAT assistant<textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} maxLength={2000} /></label><div className="runner-actions"><button type="submit">Send</button><button type="button" className="secondary-button" onClick={startVoiceInput}>Use voice input</button></div></form></aside>}</>}
  </main>
}

export default App
