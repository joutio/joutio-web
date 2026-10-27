import { useEffect, useRef } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

/** Délai de la seconde passe : la projection Axon (XP, rangs, compteurs) est différée. */
const SETTLEMENT_RETRY_MS = 2_500

/**
 * Invalide les vues impactées par la **fin d'une partie** : progression, accueil, catégories,
 * profils, salle du duel et défis tranchés. Deux passes — immédiate puis après la fenêtre de
 * projection Axon — et une seule fois par partie (`gameId`).
 */
export function useGameResultSettlement(gameId: string): void {
  const queryClient = useQueryClient()
  const settledFor = useRef<string | null>(null)

  useEffect(() => {
    if (settledFor.current === gameId) return
    settledFor.current = gameId
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.games.active() })
      void queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
      void queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all })
      // La salle du duel vient de se terminer : la carte « salon en attente » de l'accueil
      // disparaît sans attendre le poll, et les défis tranchés sont réconciliés.
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
    }
    refresh()
    const timer = window.setTimeout(refresh, SETTLEMENT_RETRY_MS)
    return () => window.clearTimeout(timer)
  }, [gameId, queryClient])
}
