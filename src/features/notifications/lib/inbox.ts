import type { NotificationView } from '@joutio/client/notifications'

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
