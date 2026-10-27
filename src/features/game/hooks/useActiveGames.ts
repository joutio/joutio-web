import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { gamesService } from "../lib/games"

/** Vue mutable (partie en cours) : rafraîchissement périodique + tolérance alignée. */
const ACTIVE_POLL_MS = 15_000

/**
 * Parties en cours du joueur (bannière de reprise) — liste vide si aucune. Le BFF expose la
 * collection `GET /api/games?active=true` (jamais de 404) ; l'affichage prend la plus récente.
 *
 * Le bandeau étant global (monté sur tous les écrans), on **sonde** tant qu'une partie est en
 * cours : hors arène il n'y a pas de flux STOMP, la partie peut se terminer ailleurs
 * (forfait adverse…) et le bandeau doit disparaître de lui-même.
 */
export function useActiveGames() {
  return useQuery({
    queryKey: queryKeys.games.active(),
    queryFn: () => gamesService.active(),
    staleTime: ACTIVE_POLL_MS,
    refetchInterval: (query) =>
      (query.state.data?.length ?? 0) > 0 ? ACTIVE_POLL_MS : false,
  })
}
