const defaultBaseUrl =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? '/api'
    : 'http://127.0.0.1:8000'

const BASE_URL = import.meta.env.VITE_API_URL || defaultBaseUrl

let authToken: string = ''
let refreshToken: string = ''

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
  })

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
