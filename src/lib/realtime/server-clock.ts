import { useEffect, useState } from 'react'
import { addLiveFrame, addRoundTrip, CLOCK_BURST, clockOffset, emptyClock, type ClockState, type RoundTrip } from '@joutio/client/game'
import type { ServerTimeView } from '@joutio/client/query'
import { api } from '../api'

/**
 * Horloge serveur (`duel-horloge-ntp`, règles dans `@joutio/client/game`) : une rafale d'allers-retours
 * `GET /api/clock` à l'ouverture d'un écran de jeu et au retour sur l'onglet garde l'échantillon de RTT minimal, puis
 * chaque trame temps réel peut **relever** le décalage (jamais le baisser : une trame retardée sous-estime). Les
 * échéances (décomptes, chrono) restent justes malgré une horloge d'appareil décalée. Même mécanique que
 * `joutio-mobile`.
 */
let clock: ClockState = emptyClock

/** Ré-ancre l'horloge sur l'instant serveur (ms epoch) d'une trame temps réel reçue à `receivedAt`. */
export function recordServerInstant(serverEpochMs: number, receivedAt: number = Date.now()) {
  clock = addLiveFrame(clock, serverEpochMs, receivedAt)
}

/** Instant serveur courant estimé (ms epoch). */
export const readServerNow = () => Date.now() + (clockOffset(clock) ?? 0)

let syncing: Promise<void> | null = null

/**
 * Rafale de mesures, appliquée d'un bloc à la fin : pendant un duel, le décalage ne recule donc qu'une fois par
 * rafale, jamais mesure par mesure. Une seule rafale à la fois.
 */
export function syncServerClock(): Promise<void> {
  syncing ??= (async () => {
    const trips: RoundTrip[] = []
    for (let n = 0; n < CLOCK_BURST; n += 1) {
      const sentAt = Date.now()
      try {
        const { epochMillis } = await api.get<ServerTimeView>('/api/clock')
        trips.push({ sentAt, receivedAt: Date.now(), serverEpochMs: epochMillis })
      } catch {
        // Mesure perdue : les autres suffisent, la rafale suivante réessaie.
      }
    }
    // Appliquées sur l'horloge courante : les trames reçues pendant la rafale restent comptées.
    clock = trips.reduce(addRoundTrip, clock)
  })().finally(() => {
    syncing = null
  })
  return syncing
}

/** Mesure le décalage tant que l'écran est monté (et à chaque retour sur l'onglet). */
export function useServerClock() {
  useEffect(() => {
    void syncServerClock()
    const onVisible = () => document.visibilityState === 'visible' && void syncServerClock()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
}

/** Instant serveur relu à `intervalMs` (décomptes). */
export function useServerNow(intervalMs = 1000) {
  const [now, setNow] = useState(readServerNow)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(readServerNow()), intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])
  return now
}
