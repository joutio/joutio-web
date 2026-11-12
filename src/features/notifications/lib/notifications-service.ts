import type { PageResponse, UnreadCountView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'
import type { NotificationView } from '@/lib/realtime'

const id = encodeURIComponent

export const NOTIFICATIONS_ENDPOINTS = {
  list: '/api/notifications',
  unreadCount: '/api/notifications/unread-count',
  read: (notificationId: string) => `/api/notifications/${id(notificationId)}/read`,
  readAll: '/api/notifications/read-all',
  remove: (notificationId: string) => `/api/notifications/${id(notificationId)}`,
} as const

export const NOTIFICATIONS_PAGE_SIZE = 10

/** Boîte de réception (`notifications.md` § 5), du plus récent au plus ancien. */
export const notificationsService = {
  unreadCount: () => api.get<UnreadCountView>(NOTIFICATIONS_ENDPOINTS.unreadCount),
  page: (page: number) => api.get<PageResponse<NotificationView>>(NOTIFICATIONS_ENDPOINTS.list, { query: { page, size: NOTIFICATIONS_PAGE_SIZE } }),
  read: (notificationId: string) => api.post<void>(NOTIFICATIONS_ENDPOINTS.read(notificationId)),
  readAll: () => api.post<void>(NOTIFICATIONS_ENDPOINTS.readAll),
  remove: (notificationId: string) => api.delete<void>(NOTIFICATIONS_ENDPOINTS.remove(notificationId)),
  removeAll: () => api.delete<void>(NOTIFICATIONS_ENDPOINTS.list),
}

export type NotificationDay = 'today' | 'week' | 'older'

/** Section d'une notification : aujourd'hui, les 6 jours précédents, puis plus ancien. */
export function dayOf(iso: string, now = new Date()): NotificationDay {
  const date = new Date(iso)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (date >= start) return 'today'
  return start.getTime() - date.getTime() < 6 * 24 * 3_600_000 ? 'week' : 'older'
}

export const isExpired = (notification: Pick<NotificationView, 'expiresAt'>, now = Date.now()) => Boolean(notification.expiresAt && Date.parse(notification.expiresAt) <= now)
export const isUnread = (notification: Pick<NotificationView, 'readAt'>) => notification.readAt === null
