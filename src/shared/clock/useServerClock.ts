import { useCallback, useEffect, useSyncExternalStore } from "react"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { clockService } from "./clock"
import {
  isServerClockSynced,
  readServerNow,
  recordServerInstant,
  subscribeServerClock,
} from "./server-clock"

export interface ServerClock {
  /** Instant serveur courant estimé (ms epoch), corrigé du décalage d'horloge. */
  serverNow: () => number
  /** Vrai dès qu'un échantillon serveur a été mesuré (sinon l'horloge locale sert de repli). */
  synced: boolean
  /** Force une re-mesure (retour au premier plan, reprise réseau, resync manuel). */
  resync: () => void
}

const SYNC_INTERVAL_MS = 60 * 1000
const SYNC_RETRY_INTERVAL_MS = 3_000

/**
 * Horloge serveur : mesure le décalage entre l'horloge locale et `GET /api/clock`, puis
 * l'entretient avec chaque trame temps réel (cf. `recordServerInstant`). Les échéances absolues
 * (deadline de question, fenêtres d'animation) sont ainsi fiables quel que soit le skew de
 * l'horloge cliente.
 *
 * <p>Un retour au premier plan ou une reprise réseau re-mesure immédiatement : après une
 * suspension d'onglet, l'offset mémorisé ne doit pas être aveuglément réutilisé.</p>
 */
export function useServerClock(): ServerClock {
  const { data, dataUpdatedAt, refetch } = useQuery({
    queryKey: queryKeys.serverTime(),
    queryFn: () => clockService.get(),
    refetchInterval: (query) =>
      query.state.data ? SYNC_INTERVAL_MS : SYNC_RETRY_INTERVAL_MS,
    staleTime: SYNC_INTERVAL_MS,
    // Chaque entrée en immersion re-mesure l'offset immédiatement (dérive NTP/réveil).
    refetchOnMount: "always",
  })

  useEffect(() => {
    // `dataUpdatedAt` (instant réel de la mesure) et non `Date.now()` : un cache React Query
    // rejoué au montage garde ainsi le même offset (ré-ancrage idempotent), au lieu de faire
    // reculer l'horloge serveur de l'âge du cache (countdowns gonflés à chaque enchaînement).
    if (data) recordServerInstant(data.epochMillis, dataUpdatedAt)
  }, [data, dataUpdatedAt])

  // Retour au premier plan / réseau : on re-mesure l'offset sans attendre le prochain tick.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetch()
    }
    const onResume = () => void refetch()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onResume)
    window.addEventListener("pageshow", onResume)
    window.addEventListener("online", onResume)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onResume)
      window.removeEventListener("pageshow", onResume)
      window.removeEventListener("online", onResume)
    }
  }, [refetch])

  const synced = useSyncExternalStore(
    subscribeServerClock,
    isServerClockSynced,
    isServerClockSynced
  )
  const serverNow = useCallback(() => readServerNow(), [])
  const resync = useCallback(() => {
    void refetch()
  }, [refetch])

  return { serverNow, synced, resync }
}
