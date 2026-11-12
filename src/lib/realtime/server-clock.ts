import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { api } from '../api'

/**
 * Horloge serveur : décalage local → serveur mesuré par `GET /api/clock` à l'ouverture d'un écran de jeu et au retour
 * sur l'onglet, puis **ré-ancré sur chaque trame temps réel** (`recordServerInstant`). Les échéances (décomptes,
 * chrono) restent justes malgré une horloge d'appareil décalée. Même mécanique que `joutio-mobile`.
 */
let offsetMs = 0

/** Ré-ancre l'horloge sur un instant serveur (ms epoch) reçu à `receivedAt`. */
export function recordServerInstant(serverEpochMs: number, receivedAt: number = Date.now()) {
  if (Number.isFinite(serverEpochMs)) offsetMs = serverEpochMs - receivedAt
}

/** Instant serveur courant estimé (ms epoch). */
export const readServerNow = () => Date.now() + offsetMs

/** Mesure le décalage tant que l'écran est monté (et à chaque retour sur l'onglet). */
export function useServerClock() {
  const { data, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['server-time'],
    queryFn: () => api.get<{ epochMillis: number }>('/api/clock'),
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
