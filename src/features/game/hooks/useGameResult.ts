import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { gamesService } from "../lib/games"

/** Intervalle de rafraîchissement tant que la récompense n'est pas projetée. */
const RESULT_POLL_MS = 800
/** Vue terminale (scores figés) mais récompense projetée en différé : tolérée 30 s. */
const RESULT_STALE_MS = 30_000

/**
 * Bilan autoritaire d'un duel terminé (`GET /api/games/{gameId}/result`).
 *
 * La projection de récompense/XP arrive après la fin de la partie : tant que `reward` est
 * `null`, la vue est rejouée toutes les 800 ms ; une fois la récompense reçue, le polling
 * s'arrête (les scores et compteurs, eux, sont déjà figés par l'événement de fin).
 *
 * `options.enabled` évite d'interroger un résultat inexistant pendant la partie : l'arène
 * n'active la vue qu'une fois l'écran de résultat affiché.
 */
export function useGameResult(
  gameId: string,
  options: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.games.result(gameId),
    queryFn: () => gamesService.result(gameId),
    enabled: !!gameId && (options.enabled ?? true),
    staleTime: RESULT_STALE_MS,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.reward == null ? RESULT_POLL_MS : false,
  })
}
