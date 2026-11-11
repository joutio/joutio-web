import { api } from './api/api-client'
import { config } from './config'
import { ENDPOINTS } from './endpoints'
import { getAccessToken } from './session/session-store'

/**
 * Télémétrie interne, best-effort : événements de la liste autorisée du BFF et erreurs navigateur. Jamais de SaaS ni de
 * contenu saisi ; le BFF connaît le joueur par le JWT. Sans session, rien ne part (les endpoints sont authentifiés).
 */
export type ProductEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'onboarding_skipped'
  | 'play_mode_opened'
  | 'duel_start_requested'
  | 'matchmaking_expired'
  | 'result_viewed'
  | 'paywall_viewed'

type ErrorType = 'JS_ERROR' | 'UNHANDLED_REJECTION' | 'REACT_RENDER' | 'API_ERROR'

const DEDUPE_MS = 60_000
const recent = new Map<string, number>()
const truncate = (value: string | undefined, max: number) => (value && value.length > max ? value.slice(0, max) : value)

function send(path: string, body: unknown): void {
  if (!getAccessToken()) return
  api.post<void>(path, body).catch(() => undefined)
}

export function trackEvent(event: ProductEvent, properties?: Record<string, string | number | boolean>): void {
  send(ENDPOINTS.telemetry.events, { event, properties: properties ?? {} })
}

export function reportClientError(error: unknown, type: ErrorType = 'JS_ERROR', source = ''): void {
  const normalized = error instanceof Error ? error : new Error(String(error))
  if (normalized.name === 'AbortError') return
  const route = window.location.pathname
  const signature = `${type}|${normalized.message}|${route}`
  const now = Date.now()
  if (now - (recent.get(signature) ?? 0) < DEDUPE_MS) return
  recent.set(signature, now)
  if (recent.size > 50) recent.delete(recent.keys().next().value as string)
  send(ENDPOINTS.telemetry.clientErrors, {
    type,
    message: truncate(normalized.message, 500),
    stack: truncate(normalized.stack, 4000),
    route,
    buildId: config.buildId,
    source: truncate(source, 120),
  })
}

let installed = false

/** Erreurs globales du navigateur, installées une fois au démarrage. */
export function installClientTelemetry(): void {
  if (installed) return
  installed = true
  window.addEventListener('error', (event) => reportClientError(event.error ?? event.message, 'JS_ERROR', 'window.error'))
  window.addEventListener('unhandledrejection', (event) => reportClientError(event.reason, 'UNHANDLED_REJECTION', 'window.unhandledrejection'))
}
