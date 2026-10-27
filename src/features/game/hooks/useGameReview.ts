import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { gamesService } from "../lib/games"
import { applyGameNotification, emptyGame } from "../domain/game-fold"
import type { GameState } from "../domain/game"

/**
 * Revue d'une partie **terminée** : un seul chargement REST de l'historique, foldé localement
 * (ordre des séquences). Aucun abonnement WebSocket, aucune horloge serveur : l'historique est
 * figé, seuls les rounds/questions sont nécessaires au replay du carousel et au forfait.
 */
export function useGameReview(
  gameId: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.games.review(gameId),
    queryFn: async () => {
      const envelopes = await gamesService.getNotifications(gameId)
      return envelopes
        .slice()
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        .reduce<GameState>(
          (state, envelope) => applyGameNotification(state, envelope.payload),
          emptyGame(gameId)
        )
    },
    enabled: !!gameId && (options.enabled ?? true),
    staleTime: Infinity,
    retry: false,
  })
}
