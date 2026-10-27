import { useQueryClient } from "@tanstack/react-query"
import { getSessionUserId as getUserId } from "@/features/auth"
import { reconcileGameViews } from "@/features/challenges"
import { queryKeys } from "@/lib/query-keys"
import { playNotificationChime } from "@/shared/audio"
import { useStompSubscription } from "@/shared/hooks/useStompSubscription"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import { dismissToast } from "@/shared/utils/toast"
import { triggerScreenNudge } from "@/shared/utils/nudge"
import type {
  NotificationDeletedPayload,
  NotificationView,
} from "@/shared/types/notifications"
import { removeNotificationFromCaches } from "../lib/notification-cache"
import { isRematchRequest } from "../domain/notification"
import { usePendingNotificationToastStore } from "../stores/usePendingNotificationToastStore"
import { useRematchRequestStore } from "../stores/useRematchRequestStore"
import { useNotificationToast } from "./useNotificationToast"

interface NotificationViewEnvelope {
  eventType?: string
  payload?: NotificationView | NotificationDeletedPayload
}

const DELETED_EVENT_TYPE = "NOTIFICATION_DELETED"

/**
 * Flux temps réel de l'inbox (`/topic/notifications/{userId}`) : déclenche le toast cliquable de
 * chaque notification (son et secousse « wizz » hors immersif), retire celles supprimées (autres
 * onglets) et rafraîchit la page et le compteur.
 *
 * `immersive` coupe les sons et la secousse ; `deferToasts` met les toasts en file pendant un
 * écran immersif (le rejeu se fait à la sortie, ou sur la page résultat d'un duel).
 */
export function useNotificationStream(
  immersive = false,
  deferToasts = immersive
): void {
  const userId = getUserId()
  const queryClient = useQueryClient()
  const soundEnabled = useSoundStore((s) => s.enabled)
  const enqueue = usePendingNotificationToastStore((s) => s.enqueue)
  const removeQueued = usePendingNotificationToastStore((s) => s.remove)
  const enqueueRematch = useRematchRequestStore((s) => s.enqueue)
  const removeRematch = useRematchRequestStore((s) => s.remove)
  const showNotificationToast = useNotificationToast()

  useStompSubscription(
    "notifications",
    userId ? `/topic/notifications/${userId}` : null,
    (message) => {
      let envelope: NotificationViewEnvelope
      try {
        envelope = JSON.parse(message.body) as NotificationViewEnvelope
      } catch {
        return
      }
      const notificationId = envelope.payload?.notificationId
      if (!notificationId) return
      if (envelope.eventType === DELETED_EVENT_TYPE) {
        removeQueued(notificationId)
        removeRematch(notificationId)
        dismissToast(`notification-${notificationId}`)
        removeNotificationFromCaches(queryClient, notificationId)
        // Une invitation de défi supprimée (annulation) doit aussi disparaître de la page Défis.
        reconcileGameViews(queryClient)
        return
      }
      const notification = envelope.payload as NotificationView
      if (soundEnabled && !immersive) {
        playNotificationChime(notification.type)
      }
      if (notification.type === "WIZZ" && !immersive) {
        // Relance (« wizz ») : secousse d'écran façon MSN, même règle que les sons
        // (les écrans immersifs restent calmes — la trace inbox et le push OS subsistent).
        triggerScreenNudge()
      }
      if (isRematchRequest(notification)) {
        // Revanche : popup dédiée (TTL 10 s), jamais le toast générique « Nouveau défi ».
        enqueueRematch(notification)
      } else if (deferToasts) {
        enqueue(notification)
      } else {
        showNotificationToast(notification)
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
      // Défis et salons de la page Défis suivent aussi le temps réel : l'acceptation d'un défi
      // crée la salle, et un salon annulé/expiré doit disparaître de la section sans attendre le poll.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.challenges.mine(),
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
    }
  )
}
