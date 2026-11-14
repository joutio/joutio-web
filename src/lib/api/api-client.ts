import { config } from '../config'
import { sessionGateway } from '../session/session-gateway'
import { PROBLEM, ApiRequestError, toApiError } from './api-error'

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Sérialisé en JSON, sauf `FormData` (multipart) envoyé tel quel. */
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  /** Cookies envoyés (auth web sur identity, cookie `AUTH_TX`). */
  credentials?: RequestCredentials
  /** Sans jeton ni rejeu sur `401` (endpoints d'authentification). */
  anonymous?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(/^https?:\/\//.test(path) ? path : `${config.apiUrl}${path}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value != null) url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json, application/problem+json' }
  let body: BodyInit | undefined
  if (options.body instanceof FormData) body = options.body
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body,
      credentials: options.credentials,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiRequestError({ message: 'Réseau indisponible' })
  }
}

/**
 * Client HTTP unique. Erreurs RFC 7807 typées (`ApiRequestError`). Un `401` déclenche **un** renouvellement de session
 * (single-flight côté moteur) puis rejoue la requête une fois. Un `403 accountSuspended` ou un `401 unknownUser` ferme
 * la session avec sa raison : l'onboarding l'affiche.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.anonymous ? null : sessionGateway.getAccessToken()
  let response = await send(path, options, token)

  if (response.status === 401 && !options.anonymous && token) {
    const problem = await toApiError(response.clone())
    if (problem.type === PROBLEM.unknownUser) {
      await sessionGateway.end('unknownUser')
      throw problem
    }
    const renewed = await sessionGateway.refresh()
    if (renewed) response = await send(path, options, renewed)
  }

  if (!response.ok) {
    const error = await toApiError(response)
    if (error.statusCode === 403 && error.type === PROBLEM.accountSuspended && !options.anonymous) {
      await sessionGateway.end('suspended', error.suspendedUntil, error.suspensionReason)
    }
    throw error
  }

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) => request<T>(path, { ...options, method: 'DELETE' }),
}
