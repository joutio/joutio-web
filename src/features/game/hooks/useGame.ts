import { useMutation } from "@tanstack/react-query"
import type { ApiError } from "@/shared/types/api"
import { gamesService } from "../lib/games"
import type { GameChoice } from "../domain/game-dto"

/** Backoff de réenvoi (ms) : couvre la fenêtre de 10 s du round sans bloquer l'UI. */
function answerRetryDelay(attempt: number): number {
  return Math.min(600 * 2 ** attempt, 3_000)
}

/**
 * Réponse du joueur à la question courante. L'état de la partie n'est pas lu ici : il est
 * reconstruit par le read model `GameState` (fold des notifications REST + WebSocket).
 *
 * Retry transparent sur les erreurs transitoires (réseau/timeout/5xx) : la carte reste
 * sélectionnée côté arène, l'utilisateur n'a rien à faire. Les 4xx (dont 409 « déjà répondu »)
 * ne sont jamais réessayés — l'écho serveur fera foi.
 */
export function useAnswerQuestion(gameId: string) {
  return useMutation({
    mutationFn: (choice: GameChoice) => gamesService.answer(gameId, choice),
    retry: (failureCount, error) => {
      const status = (error as ApiError | undefined)?.statusCode
      if (status && status >= 400 && status < 500 && status !== 408)
        return false
      return failureCount < 4
    },
    retryDelay: (attempt) => answerRetryDelay(attempt),
  })
}
