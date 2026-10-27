import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { reconcileGameViews } from "@/features/challenges"
import { queryKeys } from "@/lib/query-keys"
import { playNotificationChime } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import type {
  NotificationType,
  NotificationView,
} from "@/shared/types/notifications"
import { isRematchRequest } from "../domain/notification"
import { usePendingNotificationToastStore } from "../stores/usePendingNotificationToastStore"
import { useRematchRequestStore } from "../stores/useRematchRequestStore"
import { useNotificationToast } from "./useNotificationToast"

/** Payload du push relayé par le Service Worker (`JOUTIO_PUSH`) — sous-ensemble de `WebPushMessage`. */
interface PushPayload {
  notificationId?: string
  type?: NotificationType
  actorId?: string | null
  sourceId?: string | null
  topicId?: string | null
  gameId?: string | null
  expiresAt?: string | null
}

/**
 * Rejoue les invalidations React Query à la réception d'un push : le Service Worker relaie le
 * payload à **tous les onglets ouverts** (même en arrière-plan, quand le STOMP est en veille).
 * Inbox + badge systématiquement, vues de duel pour les types défi/salon, bannière de reprise
 * pour un défi accepté ; le toast de la notification est affiché ou mis en file selon
 * `deferToasts` (écran immersif).
 */
export function usePushMessages(deferToasts = false): void {
  const queryClient = useQueryClient()
  const soundEnabled = useSoundStore((s) => s.enabled)
  const enqueue = usePendingNotificationToastStore((s) => s.enqueue)
  const enqueueRematch = useRematchRequestStore((s) => s.enqueue)
  const showNotificationToast = useNotificationToast()

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const message = event.data as {
        type?: string
        payload?: PushPayload
      } | null
      if (!message || message.type !== "JOUTIO_PUSH") return
      const payload = message.payload ?? {}

      if (soundEnabled && document.visibilityState === "hidden") {
        playNotificationChime(payload.type)
      }

      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
      const type = payload.type
      if (type?.startsWith("CHALLENGE_") || type?.startsWith("ROOM_")) {
        reconcileGameViews(queryClient)
      }
      if (type === "ROOM_ACCEPTED") {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.games.active(),
        })
      }
      if (
        (type === "QUESTION_REPORTED" || type === "TOPIC_DRAFTED") &&
        payload.topicId
      ) {
        void queryClient.invalidateQueries({
          queryKey: ["topics", "questions", payload.topicId],
        })
        void queryClient.invalidateQueries({
          queryKey: queryKeys.topics.overview(payload.topicId),
        })
      }

      if (!type || !payload.notificationId) return
      const notification: NotificationView = {
        notificationId: payload.notificationId,
        type,
        actorId: payload.actorId ?? null,
        sourceId: payload.sourceId ?? null,
        topicId: payload.topicId ?? null,
        gameId: payload.gameId ?? null,
        expiresAt: payload.expiresAt ?? null,
        readAt: null,
        createdAt: new Date().toISOString(),
      }
      if (isRematchRequest(notification)) enqueueRematch(notification)
      else if (deferToasts) enqueue(notification)
      else showNotificationToast(notification)
    }

    navigator.serviceWorker.addEventListener("message", onMessage)
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [
    deferToasts,
    enqueue,
    enqueueRematch,
    queryClient,
    showNotificationToast,
    soundEnabled,
  ])
}
