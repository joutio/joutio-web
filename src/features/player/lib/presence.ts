import type { PresenceView } from '@joutio/client-domain/api-types'
import type { MessageKey } from '@/lib/i18n'

type T = (key: MessageKey, values?: Record<string, string | number>) => string

/** Dernière présence relative, comme le lab et le mobile : « il y a 2 h », « hier », « il y a 3 j »… */
export function relativeSeen(lastSeenAt: string, t: T, now = Date.now()): string {
  const minutes = Math.max(1, Math.round((now - Date.parse(lastSeenAt)) / 60_000))
  if (minutes < 60) return t('presence.minutes', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return t('presence.hours', { count: hours })
  const days = Math.round(hours / 24)
  if (days === 1) return t('presence.yesterday')
  if (days < 7) return t('presence.days', { count: days })
  const weeks = Math.round(days / 7)
  if (weeks < 5) return t('presence.weeks', { count: weeks })
  return t('presence.months', { count: Math.max(1, Math.round(days / 30)) })
}

/** Ligne de présence de la fiche joueur : « En ligne » ou « Dernière présence il y a 2 h ». */
export function presenceLine(presence: PresenceView | null | undefined, t: T): string {
  if (presence?.status === 'ONLINE') return t('presence.online')
  if (presence?.lastSeenAt) return t('presence.seen', { when: relativeSeen(presence.lastSeenAt, t) })
  return t('presence.offline')
}
