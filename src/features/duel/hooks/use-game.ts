import { applyGameNotification, emptyGame, type GameNotification, type GameState } from '@joutio/client-domain/game'
import { useEffect } from 'react'
import { useEventStream } from '@/lib/realtime'
import { GAME_ENDPOINTS, gameService } from '../lib/game-service'

/** Partie repliée de ses notifications : historique REST à l'ouverture (et à chaque reconnexion), puis STOMP. */
export function useGameStream(gameId: string) {
  return useEventStream<GameNotification, GameState>(
    gameId
      ? {
          destination: GAME_ENDPOINTS.topic(gameId),
          load: () => gameService.notifications(gameId),
          initial: () => emptyGame(gameId),
          apply: applyGameNotification,
          // Partie fraîchement créée : la projection peut avoir quelques centaines de ms de retard.
          notFoundGraceMs: 5_000,
        }
      : null,
  )
}

/**
 * Précharge les images des questions dès la création de la partie (`GAME_CREATED` les donne dans l'ordre des manches),
 * pendant le face-à-face : une connexion faible ne coûte pas de temps de réponse. La première d'abord, puis les autres.
 */
export function usePrefetchQuestionImages(urls: readonly string[]) {
  const key = urls.join('|')
  useEffect(() => {
    const unique = [...new Set(urls.filter(Boolean))]
    if (unique.length === 0) return
    let cancelled = false
    const load = (src: string) =>
      new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = image.onerror = () => resolve()
        image.src = src
      })
    const [first, ...rest] = unique
    void load(first).then(() => {
      if (!cancelled) rest.forEach((src) => void load(src))
    })
    return () => {
      cancelled = true
    }
    // Les URL ne changent qu'avec la partie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
