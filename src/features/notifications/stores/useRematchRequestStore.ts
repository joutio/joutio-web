import { create } from "zustand"
import type { NotificationView } from "@/shared/types/notifications"
import { isRematchRequest } from "../domain/notification"

interface RematchRequestState {
  /** Demandes de revanche reçues, dans l'ordre d'arrivée (une seule popup à la fois). */
  requests: NotificationView[]
  enqueue: (notification: NotificationView) => void
  remove: (notificationId: string) => void
  clear: () => void
}

/**
 * File des demandes de revanche reçues : alimentée par le STOMP et le push relayé, consommée par
 * la popup globale. Dédupliquée par défi (STOMP + push d'un même événement) ; la popup retire les
 * demandes dont l'échéance serveur — très courte — est dépassée.
 */
export const useRematchRequestStore = create<RematchRequestState>()((set) => ({
  requests: [],
  enqueue: (notification) => {
    if (!isRematchRequest(notification)) return
    set((state) => {
      const withoutSame = state.requests.filter(
        (queued) =>
          queued.notificationId !== notification.notificationId &&
          queued.sourceId !== notification.sourceId
      )
      return { requests: [...withoutSame, notification] }
    })
  },
  remove: (notificationId) =>
    set((state) => ({
      requests: state.requests.filter(
        (request) => request.notificationId !== notificationId
      ),
    })),
  clear: () => set({ requests: [] }),
}))
