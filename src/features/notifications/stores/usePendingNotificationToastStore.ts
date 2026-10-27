import { create } from "zustand"
import type { NotificationView } from "@/shared/types/notifications"

interface PendingNotificationToastState {
  /**
   * Notifications reçues pendant un écran immersif : leurs toasts attendent la sortie
   * d'immersion (ou la page résultat d'un duel) pour être affichés.
   */
  notifications: NotificationView[]
  enqueue: (notification: NotificationView) => void
  remove: (notificationId: string) => void
  /** Vide la file et renvoie les notifications dans leur ordre d'arrivée. */
  drain: () => NotificationView[]
  clear: () => void
}

/**
 * File d'attente des toasts de notification différés par l'immersion. Zustand porte cet état UI
 * éphémère : les notifications persistées restent dans React Query (read model serveur).
 * Le dédoublonnage par `notificationId` absorbe le doublon STOMP/push d'un même événement.
 */
export const usePendingNotificationToastStore =
  create<PendingNotificationToastState>()((set, get) => ({
    notifications: [],
    enqueue: (notification) =>
      set((state) =>
        state.notifications.some(
          (queued) => queued.notificationId === notification.notificationId
        )
          ? state
          : { notifications: [...state.notifications, notification] }
      ),
    remove: (notificationId) =>
      set((state) => ({
        notifications: state.notifications.filter(
          (notification) => notification.notificationId !== notificationId
        ),
      })),
    drain: () => {
      const { notifications } = get()
      set({ notifications: [] })
      return notifications
    },
    clear: () => set({ notifications: [] }),
  }))
