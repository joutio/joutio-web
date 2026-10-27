import { config } from "./config"
import { ENDPOINTS } from "./endpoints"
import { sessionGateway } from "./session"

/** Types d'erreur acceptés par l'allowlist BFF. */
type ClientErrorType =
  "JS_ERROR" | "UNHANDLED_REJECTION" | "REACT_RENDER" | "API_ERROR"

interface ClientErrorContext {
  type?: ClientErrorType
  /** Contexte technique React (jamais de contenu utilisateur). */
  componentStack?: string
  /** Origine du signal : window.error, ErrorBoundary, client HTTP… */
  source?: string
}

const MAX_MESSAGE = 500
const MAX_STACK = 4_000
const ERROR_DEDUPE_MS = 60_000
const MAX_TRACKED_ERRORS = 50

let installed = false
const recentErrors = new Map<string, number>()

/**
 * Télémétrie navigateur **best-effort** et 100 % interne : les événements partent vers le BFF,
 * qui les expose en métriques Prometheus et logs Loki/Grafana. Aucun SDK externe, aucune
 * donnée de formulaire, aucun identifiant dans le payload (le BFF connaît déjà l'utilisateur
 * par le JWT).
 */
export function initClientTelemetry(): void {
  if (installed || typeof window === "undefined") return
  installed = true

  window.addEventListener("error", (event) => {
    const error =
      event.error instanceof Error
        ? event.error
        : new Error(event.message || "Erreur navigateur")
    reportClientError(error, { type: "JS_ERROR", source: "window.error" })
  })

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(toError(event.reason, "Promesse rejetée"), {
      type: "UNHANDLED_REJECTION",
      source: "window.unhandledrejection",
    })
  })
}

/** Enregistre une erreur navigateur (dédupliquée par type/message/route sur une minute). */
export function reportClientError(
  error: unknown,
  context: ClientErrorContext = {}
): void {
  if (typeof window === "undefined") return

  const normalized = toError(error, "Erreur inconnue")
  if (normalized.name === "AbortError") return
  const type = context.type ?? "JS_ERROR"
  const route = window.location.pathname
  const signature = `${type}|${normalized.message}|${route}`
  const now = Date.now()
  const last = recentErrors.get(signature)
  if (last != null && now - last < ERROR_DEDUPE_MS) return

  recentErrors.set(signature, now)
  pruneErrors(now)

  void sendTelemetry(ENDPOINTS.telemetry.clientErrors, {
    type,
    message: truncate(normalized.message, MAX_MESSAGE),
    stack: truncate(normalized.stack, MAX_STACK),
    route,
    buildId: currentBuildId(),
    source: truncate(context.source ?? context.componentStack ?? "", 120),
  })
}

/** Enregistre un événement d'activation allowlisté côté BFF. */
export function trackProductEvent(
  name: string,
  properties: Record<string, string> = {}
): void {
  if (typeof window === "undefined") return
  void sendTelemetry(ENDPOINTS.telemetry.events, { name, properties })
}

async function sendTelemetry(
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  try {
    const token = sessionGateway.getAccessToken()
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) headers.Authorization = `Bearer ${token}`

    await fetch(`${config.apiUrl.replace(/\/$/, "")}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
    })
  } catch {
    // La télémétrie ne doit jamais casser l'expérience ni créer de boucle d'erreur.
  }
}

function currentBuildId(): string {
  return typeof __APP_BUILD_ID__ === "string" ? __APP_BUILD_ID__ : "dev"
}

function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error) return value
  if (typeof value === "string") return new Error(value)
  return new Error(fallback)
}

function truncate(value: string | undefined, max: number): string {
  if (!value) return ""
  const singleLine = value.replace(/[\r\n]+/g, " ")
  return singleLine.length <= max ? singleLine : singleLine.slice(0, max)
}

function pruneErrors(now: number): void {
  if (recentErrors.size <= MAX_TRACKED_ERRORS) return
  for (const [key, timestamp] of recentErrors) {
    if (now - timestamp >= ERROR_DEDUPE_MS) recentErrors.delete(key)
  }
}
