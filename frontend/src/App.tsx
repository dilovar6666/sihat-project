import { useState } from 'react'
import type { FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import './App.css'

type Question = { id: string }
type Attempt = { id: string; current_question: Question | null }
type Completion = { id: string; result?: { message?: string } }
type ActivityKind = 'visual' | 'audio' | 'memory' | 'attention' | 'reflection' | 'reaction' | 'pointer' | 'processing'
type Activity = { slug: string; title: string; description: string; kind: ActivityKind }

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
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('')
  const [completion, setCompletion] = useState<Completion | null>(null)
  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(api + path, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...init.headers } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(typeof body.detail === 'string' ? body.detail : 'Request failed')
    return body
  }
  const login = async (event: FormEvent) => {
    event.preventDefault()
    try { const body = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setToken(body.access_token); setMessage('') }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in') }
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
  return <main className="app-shell">
    <header className="app-header"><p className="eyebrow">SIHAT educational exercises</p><h1>Practice small skills, without health labels.</h1><p className="lede">These activities are for learning and personal reflection. They do not screen for, diagnose, or measure a health condition.</p></header>
    {!token ? <form className="login-card" onSubmit={login}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label><button type="submit">Sign in to choose an exercise</button></form> : completion ? <section className="completion-card" aria-live="polite"><h2>Exercise complete</h2><p>{completion.result?.message ?? 'Your exercise response was recorded.'}</p><p>It is not a diagnosis or health result. Choose whether to save this result to your private history.</p><div className="runner-actions"><button onClick={() => decideSave(true)}>Save</button><button className="secondary-button" onClick={() => decideSave(false)}>Do not save</button></div></section> : attempt && selectedActivity ? <section className="runner-card"><div className="runner-heading"><div><p className="eyebrow">{selectedActivity.slug}</p><h2>{selectedActivity.title}</h2><p>{selectedActivity.description}</p></div><button className="quiet-button" onClick={discard}>Leave exercise</button></div><ExercisePanel key={selectedActivity.slug} activity={selectedActivity} onReady={setReady} /><div className="runner-actions"><button className="secondary-button" onClick={() => respond('skipped')}>Skip exercise</button><button disabled={!ready} onClick={() => respond('completed')}>Complete exercise</button></div></section> : <section className="activity-list" aria-label="Educational exercises"><div className="section-heading"><h2>Choose an activity</h2><button className="quiet-button" onClick={() => { setToken(''); setCompletion(null) }}>Sign out</button></div><div className="activity-grid">{activities.map((activity) => <article key={activity.slug}><p className="eyebrow">{activity.kind}</p><h3>{activity.title}</h3><p>{activity.description}</p><button onClick={() => start(activity)}>Start exercise</button></article>)}</div></section>}
    {message && <p className="message" role="alert">{message}</p>}
  </main>
}

export default App
