import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { EventStream, type EventEnvelope } from './event-stream'
import { recordServerInstant } from './server-clock'
import { subscribeStomp } from './stomp'

export type UseEventStreamOptions<T, S> = {
  /** Destination STOMP de l'agrégat (`/topic/rooms/{id}`…). */
  destination: string
  load: () => Promise<EventEnvelope<T>[]>
  initial: () => S
  apply: (state: S, payload: T) => S
  notFoundGraceMs?: number
}

/**
 * Monte un `EventStream` le temps de vie du composant : historique REST à l'ouverture, puis STOMP seul ; chaque trame
 * live ré-ancre l'horloge serveur. `null` : aucun flux.
 */
export function useEventStream<T, S>(options: UseEventStreamOptions<T, S> | null) {
  const key = options?.destination ?? ''
  // Un flux par destination : les options (fonctions) changent à chaque rendu, seul `key` compte.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stream = useMemo(() => (options ? create(options) : null), [key])

  useEffect(() => {
    if (!stream) return
    stream.start()
    return () => stream.stop()
  }, [stream])

  const noop = () => () => undefined
  const state = useSyncExternalStore(stream?.subscribe ?? noop, () => stream?.getSnapshot() ?? null)
  const status = useSyncExternalStore(stream?.subscribe ?? noop, () => stream?.getStatus() ?? null)
  return { state, status, refresh: () => stream?.refresh() }
}

function create<T, S>(options: UseEventStreamOptions<T, S>) {
  return new EventStream<T, S>({
    load: options.load,
    initial: options.initial,
    apply: options.apply,
    notFoundGraceMs: options.notFoundGraceMs,
    subscribe: (onFrame, onConnect) => subscribeStomp(options.destination, (message) => onFrame(message.body), onConnect),
    onLive: (envelope, receivedAt) => recordServerInstant(Date.parse(envelope.timestamp), receivedAt),
  })
}
