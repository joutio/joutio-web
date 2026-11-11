import type { UnreadCountView } from '@joutio/client-domain/api-types'
import { api } from '@/lib/api'

export const NOTIFICATIONS_ENDPOINTS = {
  unreadCount: '/api/notifications/unread-count',
} as const

export const notificationsService = {
  unreadCount: () => api.get<UnreadCountView>(NOTIFICATIONS_ENDPOINTS.unreadCount),
}
