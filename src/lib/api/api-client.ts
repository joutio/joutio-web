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
  /**
   * Progression de l'envoi (0 à 1) d'un corps `FormData` : `fetch` ne la rapporte pas, l'envoi passe alors par
   * `XMLHttpRequest` (`upload.onprogress`), avec les mêmes en-têtes, erreurs et renouvellement de session.
   */
  onUploadProgress?: (fraction: number) => void
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
  const url = buildUrl(path, options.query)
  if (options.onUploadProgress && body instanceof FormData) return sendWithProgress(url, options, headers, body, options.onUploadProgress)
  try {
    return await fetch(url, {
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

/** En-têtes bruts de `XMLHttpRequest` (`getAllResponseHeaders`) en `Headers`. */
function parseHeaders(raw: string): Headers {
  const headers = new Headers()
  for (const line of raw.trim().split(/[\r\n]+/)) {
    const separator = line.indexOf(':')
    if (separator > 0) headers.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim())
  }
  return headers
}

/** Envoi `FormData` avec progression : la réponse est rendue en `Response`, traitée comme celle de `fetch`. */
function sendWithProgress(url: string, options: RequestOptions, headers: Record<string, string>, body: FormData, onProgress: (fraction: number) => void): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method ?? 'POST', url)
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.withCredentials = options.credentials === 'include'
    xhr.responseType = 'text'
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total)
    }
    xhr.onload = () => {
      onProgress(1)
      const empty = xhr.status === 204 || xhr.status === 205 || xhr.status === 304
      resolve(new Response(empty ? null : xhr.responseText, { status: xhr.status, statusText: xhr.statusText, headers: parseHeaders(xhr.getAllResponseHeaders()) }))
    }
    xhr.onerror = () => reject(new ApiRequestError({ message: 'Réseau indisponible' }))
    xhr.onabort = () => reject(new DOMException('Requête annulée', 'AbortError'))
    if (options.signal?.aborted) return xhr.abort()
    options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })
    xhr.send(body)
  })
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
