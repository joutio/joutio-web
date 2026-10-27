import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Page } from "@/shared/types/api"
import type {
  NotificationCategory,
  NotificationPreferenceView,
  NotificationView,
} from "@/shared/types/notifications"

/** Inbox personnelle : page, compteur non lus, transitions de lecture, préférences. */
export const notificationsService = {
  list: (params: { unreadOnly?: boolean; page?: number; size?: number }) =>
    api.get<Page<NotificationView>>(ENDPOINTS.notifications.list, {
      params: {
        unreadOnly: params.unreadOnly ?? false,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    }),

  unreadCount: (): Promise<{ count: number }> =>
    api.get<{ count: number }>(ENDPOINTS.notifications.unreadCount),

  markRead: (
    notificationId: string,
    options: { skipErrorBus?: boolean } = {}
  ): Promise<void> =>
    api.post<void>(ENDPOINTS.notifications.read(notificationId), undefined, options),

  /** Repasse une notification en non lue (swipe inversé / menu desktop). */
  markUnread: (notificationId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.notifications.unread(notificationId)),

  /** Supprime (hard delete) la notification — propriétaire uniquement. */
  remove: (notificationId: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.notifications.remove(notificationId)),

  /** Vide l'inbox du joueur courant (hard delete de toutes les notifications). */
  removeAll: (): Promise<void> =>
    api.delete<void>(ENDPOINTS.notifications.removeAll),

  markAllRead: (): Promise<void> =>
    api.post<void>(ENDPOINTS.notifications.readAll),

  preferences: (): Promise<NotificationPreferenceView[]> =>
    api.get<NotificationPreferenceView[]>(ENDPOINTS.notifications.preferences),

  updatePreference: (
    category: NotificationCategory,
    enabled: boolean
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.notifications.preference(category), { enabled }),
}
