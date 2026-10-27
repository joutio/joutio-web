import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { createGameStream } from "../application/game-repository"
import { emptyGame } from "../domain/game-fold"
import type { GameState } from "../domain/game"

interface UseGameStateResult {
  game: GameState
  isLoading: boolean
  /** Erreur terminale (partie inexistante/inaccessible) — les erreurs réseau sont retentées. */
  isError: boolean
  /** Un rechargement transitoire est en cours (connexion instable). */
  isRetrying: boolean
  /** Un trou de séquence a été détecté : l'historique est en cours de rejeu. */
  isLagging: boolean
  /** Rejoue l'historique REST : filet de rattrapage si une trame WS est manquée. */
  refresh: () => void
}

/**
 * État d'une partie, reconstruit par fold des notifications (historique REST + WebSocket).
 * Remplace le polling de la projection : aucun `refetchInterval`.
 */
export function useGameState(gameId: string): UseGameStateResult {
  const stream = useMemo(() => createGameStream(gameId), [gameId])
  const fallback = useMemo(() => emptyGame(gameId), [gameId])

  useEffect(() => {
    stream.start()
    return () => stream.stop()
  }, [stream])

  const game =
    useSyncExternalStore(
      stream.subscribe,
      stream.getSnapshot,
      stream.getSnapshot
    ) ?? fallback
  const status = useSyncExternalStore(
    stream.subscribe,
    stream.getStatus,
    stream.getStatus
  )
  const refresh = useCallback(() => stream.refresh(), [stream])

  return {
    game,
    isLoading: !status.loaded && !status.terminalError,
    isError: status.terminalError,
    isRetrying: status.retrying,
    isLagging: status.lagging,
    refresh,
  }
}
