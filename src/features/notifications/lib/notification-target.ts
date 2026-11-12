import type { NotificationView } from '@/lib/realtime'

export type NotificationTarget =
  | { kind: 'player'; id: string }
  | { kind: 'challenges' }
  | { kind: 'room'; id: string }
  | { kind: 'workshop'; id: string }
  | { kind: 'suspended' }
  | { kind: 'fallback'; challenges: boolean; expired: boolean }

const INVITATIONS = new Set<NotificationView['type']>(['CHALLENGE_RECEIVED', 'CHALLENGE_DECLINED', 'ROOM_ACCEPTED', 'WIZZ'])

/**
 * Écran qui propose l'action d'une notification (`notifications.md` § 2, repris du mobile) : abonné ou défi refusé →
 * fiche joueur, défi reçu → Défis, défi accepté ou relance → salon, brouillon ou signalement → atelier du sujet. Aucune
 * URL ne vient du payload.
 */
export function notificationTarget(notice: NotificationView, now = Date.now()): NotificationTarget {
  const fallback: NotificationTarget = {
    kind: 'fallback',
    challenges: INVITATIONS.has(notice.type),
    expired: Boolean(notice.expiresAt && Date.parse(notice.expiresAt) <= now),
  }
  if (fallback.expired) return fallback
  switch (notice.type) {
    case 'FOLLOW':
    case 'CHALLENGE_DECLINED':
      return notice.actorId ? { kind: 'player', id: notice.actorId } : fallback
    case 'CHALLENGE_RECEIVED':
      return { kind: 'challenges' }
    case 'ROOM_ACCEPTED':
    case 'WIZZ':
      return notice.sourceId ? { kind: 'room', id: notice.sourceId } : fallback
    case 'QUESTION_REPORTED':
    case 'TOPIC_DRAFTED':
      return notice.topicId ? { kind: 'workshop', id: notice.topicId } : fallback
    case 'ACCOUNT_SUSPENDED':
      return { kind: 'suspended' }
    default:
      return fallback
  }
}
