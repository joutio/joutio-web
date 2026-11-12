/** Enveloppe d'un événement d'agrégat, identique en REST (historique) et en STOMP (`EventEnvelopeResponse` du BFF). */
export interface EventEnvelope<T> {
  aggregateId: string
  sequenceNumber: number
  timestamp: string
  eventType: string
  payload: T
}

export type EventStreamStatus = {
  loaded: boolean
  /** Chargement transitoire en échec : nouvelle tentative planifiée. */
  retrying: boolean
  /** Erreur définitive (4xx) : l'agrégat n'existe pas ou plus. */
  terminalError: boolean
  /** Trou de séquence détecté : rattrapage en cours. */
  lagging: boolean
}

export type EventStreamSource<T> = {
  /** Historique REST de l'agrégat. */
  load: () => Promise<EventEnvelope<T>[]>
  /** Abonnement live ; `onConnect` est rappelé à chaque (re)connexion. Renvoie le désabonnement. */
  subscribe: (onFrame: (body: string) => void, onConnect: () => void) => () => void
}

export type EventStreamOptions<T, S> = EventStreamSource<T> & {
  initial: () => S
  /** Fold pur, en général celui de `@joutio/client-domain`. */
  apply: (state: S, payload: T) => S
  /** Trame live reçue (hors rejeu) : ré-ancrage de l'horloge serveur. */
  onLive?: (envelope: EventEnvelope<T>, receivedAt: number) => void
  /** Tolère un 404 au premier chargement pendant cette fenêtre (projection encore en retard). */
  notFoundGraceMs?: number
}

const RETRY_BASE_MS = 1000
const RETRY_MAX_MS = 8000
const GAP_GRACE_MS = 400

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const isEnvelope = (value: unknown): value is EventEnvelope<unknown> =>
  isRecord(value) && typeof value.aggregateId === 'string' && typeof value.sequenceNumber === 'number' && isRecord(value.payload)
const statusOf = (error: unknown) => (error as { statusCode?: number } | undefined)?.statusCode

/**
 * Flux d'événements idempotent : historique REST au démarrage puis entretien par STOMP seul (aucun polling).
 * Dédoublonnage par `sequenceNumber` (REST et WS partagent l'enveloppe) ; trames hors ordre bufferisées puis appliquées
 * dans l'ordre ; un trou non comblé sous 400 ms rejoue l'historique ; chaque (re)connexion rejoue l'historique pour
 * fermer la fenêtre REST ↔ WS. Utilisable avec `useSyncExternalStore` (`subscribe`, `getSnapshot`).
 */
export class EventStream<T, S> {
  private readonly options: EventStreamOptions<T, S>
  private state: S
  private lastSequence = -1
  private loading = false
  private reloadQueued = false
  private started = false
  private startedAt = 0
  private pending: EventEnvelope<T>[] = []
  private buffered = new Map<number, EventEnvelope<T>>()
  private gapTimer?: ReturnType<typeof setTimeout>
  private retryTimer?: ReturnType<typeof setTimeout>
  private retryAttempt = 0
  private unsubscribeLive?: () => void
  private status: EventStreamStatus = { loaded: false, retrying: false, terminalError: false, lagging: false }
  private readonly listeners = new Set<() => void>()

  constructor(options: EventStreamOptions<T, S>) {
    this.options = options
    this.state = options.initial()
  }

  getSnapshot = (): S => this.state
  getStatus = (): EventStreamStatus => this.status

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start(): void {
    if (this.started) return
    this.started = true
    this.startedAt = Date.now()
    // Abonnement avant le chargement : les trames reçues pendant le GET sont fusionnées ensuite.
    this.unsubscribeLive = this.options.subscribe((body) => this.onFrame(body), () => this.requestReload())
    if (!this.loading) this.requestReload()
  }

  stop(): void {
    this.started = false
    clearTimeout(this.retryTimer)
    clearTimeout(this.gapTimer)
    this.retryTimer = this.gapTimer = undefined
    this.buffered.clear()
    this.retryAttempt = 0
    this.status = { ...this.status, retrying: false, lagging: false }
    this.unsubscribeLive?.()
    this.unsubscribeLive = undefined
  }

  /** Rejoue l'historique (filet de rattrapage). */
  refresh = (): void => this.requestReload()

  private requestReload(): void {
    if (this.loading) {
      this.reloadQueued = true
      return
    }
    void this.reload()
  }

  private async reload(): Promise<void> {
    this.loading = true
    this.pending = []
    clearTimeout(this.gapTimer)
    this.gapTimer = undefined
    try {
      const loaded = await this.options.load()
      this.state = this.options.initial()
      this.lastSequence = -1
      for (const envelope of Array.isArray(loaded) ? loaded : []) if (isEnvelope(envelope)) this.applyEnvelope(envelope)
      const merge = [...this.pending, ...this.buffered.values()].sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      this.pending = []
      this.buffered.clear()
      for (const envelope of merge) {
        if (envelope.sequenceNumber <= this.lastSequence) continue
        if (envelope.sequenceNumber === this.lastSequence + 1) this.applyEnvelope(envelope)
        else this.buffered.set(envelope.sequenceNumber, envelope)
      }
      this.retryAttempt = 0
      this.status = { loaded: true, retrying: false, terminalError: false, lagging: this.buffered.size > 0 }
      if (this.buffered.size > 0) this.scheduleGapHeal()
    } catch (error) {
      this.pending = []
      const status = statusOf(error)
      const grace = this.options.notFoundGraceMs
      if (status === 404 && !this.status.loaded && grace != null && Date.now() - this.startedAt < grace) {
        this.scheduleRetry(500)
      } else if (status != null && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        this.status = { ...this.status, retrying: false, terminalError: true }
      } else if (this.started) {
        this.retryAttempt += 1
        this.status = { ...this.status, retrying: true }
        this.scheduleRetry(Math.min(RETRY_BASE_MS * 2 ** (this.retryAttempt - 1), RETRY_MAX_MS))
      }
    } finally {
      this.loading = false
      this.emit()
      if (this.reloadQueued) {
        this.reloadQueued = false
        this.requestReload()
      }
    }
  }

  private onFrame(body: string): void {
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      return
    }
    if (!isEnvelope(parsed)) return
    const envelope = parsed as EventEnvelope<T>
    if (this.loading) {
      this.pending.push(envelope)
      return
    }
    this.options.onLive?.(envelope, Date.now())
    if (envelope.sequenceNumber <= this.lastSequence) return
    if (envelope.sequenceNumber === this.lastSequence + 1) {
      this.applyEnvelope(envelope)
      for (let next = this.buffered.get(this.lastSequence + 1); next; next = this.buffered.get(this.lastSequence + 1)) {
        this.buffered.delete(next.sequenceNumber)
        this.applyEnvelope(next)
      }
      if (this.buffered.size === 0) {
        clearTimeout(this.gapTimer)
        this.gapTimer = undefined
        this.status = { ...this.status, lagging: false }
      }
      this.emit()
      return
    }
    this.buffered.set(envelope.sequenceNumber, envelope)
    this.status = { ...this.status, lagging: true }
    this.scheduleGapHeal()
    this.emit()
  }

  private applyEnvelope(envelope: EventEnvelope<T>): void {
    const next = this.options.apply(this.state, envelope.payload)
    if (next !== undefined) this.state = next
    this.lastSequence = Math.max(this.lastSequence, envelope.sequenceNumber)
  }

  private scheduleRetry(delay: number): void {
    if (!this.started || this.retryTimer) return
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      this.requestReload()
    }, delay)
  }

  private scheduleGapHeal(): void {
    if (this.gapTimer) return
    this.gapTimer = setTimeout(() => {
      this.gapTimer = undefined
      if (this.buffered.size > 0) this.requestReload()
    }, GAP_GRACE_MS)
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener())
  }
}
