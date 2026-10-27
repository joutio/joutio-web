import { useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { profilesService } from "@/features/player"
import { useStompSubscription } from "@/shared/hooks/useStompSubscription"
import type { Presence } from "@/features/player/domain/presence"

/** Durée pendant laquelle la présence d'un joueur est considérée fraîche côté cache. */
const STALE_MS = 15_000

/**
 * Présence d'un joueur : état initial en REST (`GET /api/presence/{userId}`, 404 = jamais
 * connecté → hors ligne), puis transitions poussées par WebSocket (`/topic/presence/{userId}`).
 * La connexion STOMP est maintenue par `PresenceConnection` — aucun polling.
 */
export function usePresence(userId: string) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.presence.detail(userId),
    queryFn: () => profilesService.presence(userId),
    enabled: !!userId,
    staleTime: STALE_MS,
  })

  useStompSubscription(
    "profile",
    userId ? `/topic/presence/${userId}` : null,
    (message) => {
      try {
        const presence = JSON.parse(message.body) as Presence
        queryClient.setQueryData<Presence>(
          queryKeys.presence.detail(userId),
          presence
        )
      } catch {
        /* message non exploitable : la prochaine lecture REST corrigera */
      }
    }
  )

  return query
}
