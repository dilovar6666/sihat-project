import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Question = { id: string; localizations: Record<string, { text?: string }>; options?: { id: string; localizations: Record<string, { label?: string }> }[] }
type Attempt = { id: string; current_question: Question | null }
const api = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [answer, setAnswer] = useState('')
  const [message, setMessage] = useState('')
  const request = async (path: string, init: RequestInit = {}) => {
    const response = await fetch(`${api}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers } })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body.detail ?? 'Request failed')
    return body
  }
  const login = async (event: FormEvent) => { event.preventDefault(); const body = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setToken(body.access_token) }
  const start = async () => { try { setAttempt(await request('/attempts/start', { method: 'POST', body: JSON.stringify({ test_slug: 'contrast-sensitivity' }) })) } catch (error) { setMessage(String(error)) } }
  const submit = async () => { if (attempt?.current_question) setAttempt(await request(`/attempts/${attempt.id}/answer`, { method: 'POST', body: JSON.stringify({ question_id: attempt.current_question.id, answer }) })) }
  return <main><h1>SIHAT technical exercise runner</h1>{!token ? <form onSubmit={login}><input placeholder="Email" onChange={e => setEmail(e.target.value)} /><input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} /><button>Sign in</button></form> : !attempt ? <button onClick={start}>Start contrast exercise</button> : attempt.current_question ? <section><p>{attempt.current_question.localizations.en?.text}</p>{attempt.current_question.options?.map(option => <button key={option.id} onClick={() => setAnswer(option.id)}>{option.localizations.en?.label ?? option.id}</button>)}<button disabled={!answer} onClick={submit}>Submit</button></section> : <button onClick={() => request(`/attempts/${attempt.id}/complete`, { method: 'POST' }).then(body => setMessage(`Score: ${body.result?.score}`))}>Complete</button>}<p role="alert">{message}</p></main>
}
export default App
