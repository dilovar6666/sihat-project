import type { SupportTicket, SupportMessage } from './types'
const defaultBaseUrl =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://127.0.0.1:8000'

const BASE_URL = import.meta.env.VITE_API_URL || defaultBaseUrl

let authToken: string = ''
let refreshToken: string = ''
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

export function setApiToken(token: string) {
  authToken = token
  if (token) sessionStorage.setItem('sihat_access_token', token)
  else sessionStorage.removeItem('sihat_access_token')
}

export function getApiToken(): string {
  return authToken
}

export function setRefreshToken(token: string) {
  refreshToken = token
  if (token) sessionStorage.setItem('sihat_refresh_token', token)
  else sessionStorage.removeItem('sihat_refresh_token')
}

export function getRefreshToken(): string {
  return refreshToken
}

export function restoreSessionTokens() {
  authToken = sessionStorage.getItem('sihat_access_token') ?? ''
  refreshToken = sessionStorage.getItem('sihat_refresh_token') ?? ''
  return { accessToken: authToken, refreshToken }
}

export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const makeHeaders = (token: string): Record<string, string> => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  })

  let response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: makeHeaders(authToken),
  })

  // Silent automatic token refresh if 401 Unauthorized occurs on an authenticated route
  if (
    response.status === 401 &&
    refreshToken &&
    !path.startsWith('/auth/login') &&
    !path.startsWith('/auth/refresh') &&
    !path.startsWith('/auth/register')
  ) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        })

        if (refreshResponse.ok) {
          const data = (await refreshResponse.json()) as { access_token: string; refresh_token: string }
          setApiToken(data.access_token)
          setRefreshToken(data.refresh_token)
          isRefreshing = false
          onRefreshed(data.access_token)
        } else {
          isRefreshing = false
          setApiToken('')
          setRefreshToken('')
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('sihat:session_expired'))
          }
          throw new Error('Session expired, please log in again.')
        }
      } catch (err) {
        isRefreshing = false
        setApiToken('')
        setRefreshToken('')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sihat:session_expired'))
        }
        throw err
      }
    } else {
      // Wait for existing refresh in progress to complete
      await new Promise<string>((resolve) => {
        subscribeTokenRefresh((newToken) => resolve(newToken))
      })
    }

    // Retry request with fresh token
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: makeHeaders(authToken),
    })
  }

  if (response.status === 204) {
    return {} as T
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/pdf')) {
    return (await response.blob()) as unknown as T
  }

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : 'Request failed'
    throw new Error(detail)
  }

  return body as T
}

export async function downloadPdfBlob(
  resultId: string,
  options: {
    include_result: boolean
    include_methodology: boolean
    include_limitations: boolean
    include_answers: boolean
    include_warnings: boolean
    lang?: string
  },
) {
  const blob = await apiRequest<Blob>(`/results/${resultId}/pdf`, {
    method: 'POST',
    body: JSON.stringify(options),
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sihat_result_${resultId.slice(0, 8)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export async function downloadDirectPdfBlob(
  payload: {
    test_slug: string
    result: unknown
    answers?: Record<string, unknown>
    include_result?: boolean
    include_methodology?: boolean
    include_limitations?: boolean
    include_answers?: boolean
    include_warnings?: boolean
    lang?: string
  },
  customFilename?: string
) {
  const blob = await apiRequest<Blob>('/results/export-pdf-direct', {
    method: 'POST',
    body: JSON.stringify({
      test_slug: payload.test_slug,
      result: payload.result,
      answers: payload.answers || {},
      include_result: payload.include_result ?? true,
      include_methodology: payload.include_methodology ?? true,
      include_limitations: payload.include_limitations ?? true,
      include_answers: payload.include_answers ?? false,
      include_warnings: payload.include_warnings ?? true,
      lang: payload.lang || 'ru',
    }),
  })

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = customFilename || `sihat_screening_${payload.test_slug}_${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}


// ---------------------------------------------------------------------------
// Support Chat API
// ---------------------------------------------------------------------------

export async function fetchMySupportTickets(): Promise<SupportTicket[]> {
  return apiRequest<SupportTicket[]>('/support/my-tickets')
}

export async function fetchSupportTicketDetail(ticketId: string): Promise<SupportTicket> {
  return apiRequest<SupportTicket>(`/support/tickets/${ticketId}`)
}

export async function sendSupportTicketMessage(ticketId: string, message: string): Promise<SupportMessage> {
  return apiRequest<SupportMessage>(`/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export async function toggleBlockSupportTicket(ticketId: string, isBlocked: boolean): Promise<SupportTicket> {
  return apiRequest<SupportTicket>(`/support/tickets/${ticketId}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ is_blocked: isBlocked }),
  })
}

export async function deleteSupportTicket(ticketId: string): Promise<{ status: string; id: string }> {
  return apiRequest<{ status: string; id: string }>(`/support/tickets/${ticketId}`, {
    method: 'DELETE',
  })
}

export async function fetchSupportUnreadCount(): Promise<number> {
  try {
    const res = await apiRequest<{ unread_count: number }>('/support/unread-count')
    return res.unread_count || 0
  } catch {
    return 0
  }
}

export async function createSupportTicket(payload: { contact_email: string; subject: string; message: string }): Promise<SupportTicket> {
  return apiRequest<SupportTicket>('/support/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
