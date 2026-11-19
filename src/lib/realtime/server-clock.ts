import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../api'
import { serverTimeQuery } from '@joutio/client/query'

/**
 * Horloge serveur : décalage local → serveur mesuré par `GET /api/clock` à l'ouverture d'un écran de jeu et au retour
 * sur l'onglet, puis **ré-ancré sur chaque trame temps réel** (`recordServerInstant`). Les échéances (décomptes,
 * chrono) restent justes malgré une horloge d'appareil décalée. Même mécanique que `joutio-mobile`.
 */
let offsetMs: number | null = null

/**
 * Un recul plus petit que ce seuil vient d'une trame retardée (la latence du réseau réduit `serveur - réception`), pas
 * d'un vrai décalage : l'ignorer garde une horloge qui ne recule jamais, sinon une scène du duel repassait en arrière et
 * son intro se rejouait (2026-11-19). Un recul plus grand (montre de l'appareil changée) est appliqué.
 */
export const CLOCK_BACKSTEP_TOLERANCE_MS = 300

/** Décalage retenu après un échantillon : on garde le plus grand, sauf vrai recalage. */
export function nextClockOffset(current: number | null, sample: number): number {
  if (current === null || sample >= current || current - sample >= CLOCK_BACKSTEP_TOLERANCE_MS) return sample
  return current
}

/** Ré-ancre l'horloge sur un instant serveur (ms epoch) reçu à `receivedAt`. */
export function recordServerInstant(serverEpochMs: number, receivedAt: number = Date.now()) {
  if (Number.isFinite(serverEpochMs)) offsetMs = nextClockOffset(offsetMs, serverEpochMs - receivedAt)
}

/** Instant serveur courant estimé (ms epoch). */
export const readServerNow = () => Date.now() + (offsetMs ?? 0)

/** Mesure le décalage tant que l'écran est monté (et à chaque retour sur l'onglet). */
export function useServerClock() {
  const { data, dataUpdatedAt, refetch } = useQuery({
    ...serverTimeQuery(api),
    refetchOnMount: 'always',
    staleTime: Infinity,
    retry: 3,
  })
  useEffect(() => {
    if (data) recordServerInstant(data.epochMillis, dataUpdatedAt)
  }, [data, dataUpdatedAt])
  useEffect(() => {
    const onVisible = () => document.visibilityState === 'visible' && void refetch()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refetch])
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
