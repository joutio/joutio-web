import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { Page } from "@/shared/types/api"
import type { NotificationView } from "@/shared/types/notifications"
import { useMarkNotificationRead } from "./useNotifications"

/**
 * Tranche une invitation de défi depuis la page Défis & Salons : marque lue la notification
 * `CHALLENGE_RECEIVED` liée au défi quand elle est présente dans les vues inbox en cache, pour
 * que le badge et la cloche restent cohérents quand l'action ne passe pas par la ligne d'inbox.
 */
export function useResolveChallenge() {
  const queryClient = useQueryClient()
  const markRead = useMarkNotificationRead()

  return (challengeId: string) => {
    const entries = queryClient.getQueriesData({
      queryKey: queryKeys.notifications.all,
    })
    for (const [, data] of entries) {
      if (!data || typeof data !== "object" || !("content" in data)) continue
      const page = data as Page<NotificationView>
      const match = page.content.find(
        (notification) =>
          notification.type === "CHALLENGE_RECEIVED" &&
          notification.sourceId === challengeId
      )
      if (!match) continue
      markRead.mutate(match.notificationId)
      return
    }
  }
}
