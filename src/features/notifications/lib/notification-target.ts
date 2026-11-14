import type { NotificationView } from '@/lib/realtime'
import type { ChallengesTab } from '@/shared/routes'

export type NotificationTarget =
  | { kind: 'player'; id: string }
  | { kind: 'challenges'; tab: ChallengesTab }
  | { kind: 'room'; id: string }
  | { kind: 'workshop'; id: string }
  | { kind: 'report'; topicId: string; reportId: string }
  | { kind: 'suspended' }
  /** Informative : marquée lue, rien ne s'ouvre. */
  | { kind: 'none' }
  /** `challenges` : onglet de Défis où retomber, `null` hors invitation. */
  | { kind: 'fallback'; challenges: ChallengesTab | null; expired: boolean }

/**
 * Onglet de Défis d'une invitation (`notifications.md` § 2, 2026-11-14) : défi reçu ou relance → Reçus. `null` : la
 * notification ne concerne pas les défis.
 */
const INVITATIONS: Partial<Record<NotificationView['type'], ChallengesTab>> = {
  CHALLENGE_RECEIVED: 'received',
  WIZZ: 'received',
}

/**
 * Notifications sans écran d'action (2026-11-14) : défi accepté et défi refusé ne font qu'informer. Le toucher les marque
 * lues, sans redirection ni chevron.
 */
const INFORMATIVE = new Set<string>(['ROOM_ACCEPTED', 'CHALLENGE_DECLINED'])

/** Vrai si toucher la notification ouvre un écran (chevron de la ligne). */
export const opensScreen = (type: string) => !INFORMATIVE.has(type)

/**
 * Écran qui propose l'action d'une notification (`notifications.md` § 2, repris du mobile) : abonné → fiche joueur,
 * défi reçu → Défis, relance → salon, défi accepté ou refusé → rien (informative), brouillon → Mon sujet, signalement → Signalements de sa question. Aucune
 * URL ne vient du payload.
 */
export function notificationTarget(notice: NotificationView, now = Date.now()): NotificationTarget {
  const fallback: NotificationTarget = {
    kind: 'fallback',
    challenges: INVITATIONS[notice.type] ?? null,
    expired: Boolean(notice.expiresAt && Date.parse(notice.expiresAt) <= now),
  }
  if (INFORMATIVE.has(notice.type)) return { kind: 'none' }
  if (fallback.expired) return fallback
  switch (notice.type) {
    case 'FOLLOW':
      return notice.actorId ? { kind: 'player', id: notice.actorId } : fallback
    case 'CHALLENGE_RECEIVED':
      return { kind: 'challenges', tab: 'received' }
    case 'WIZZ':
      return notice.sourceId ? { kind: 'room', id: notice.sourceId } : fallback
    case 'QUESTION_REPORTED':
      if (notice.topicId && notice.sourceId) return { kind: 'report', topicId: notice.topicId, reportId: notice.sourceId }
      return notice.topicId ? { kind: 'workshop', id: notice.topicId } : fallback
    case 'TOPIC_DRAFTED':
      return notice.topicId ? { kind: 'workshop', id: notice.topicId } : fallback
    case 'ACCOUNT_SUSPENDED':
      return { kind: 'suspended' }
    default:
      return fallback
  }
}

/**
 * Toast à la réception (`toast.md`, repris du mobile) : seulement non lue, non expirée, onglet visible. Une revanche passe par
 * sa popup, jamais par un toast ; pendant un duel, le gestionnaire met le toast en attente.
 */
export function shouldToast(notice: Pick<NotificationView, 'type' | 'gameId' | 'expiresAt' | 'readAt'>, visible: boolean, now = Date.now()) {
  return (
    visible &&
    notice.readAt === null &&
    !(notice.expiresAt && Date.parse(notice.expiresAt) <= now) &&
    !(notice.type === 'CHALLENGE_RECEIVED' && notice.gameId)
  )
}

/** Une notification n'est annoncée qu'une fois, même relivrée par le flux (reconnexion STOMP). */
export function createNotificationDeduplicator(limit = 256) {
  const seen = new Set<string>()
  return (id: string) => {
    if (seen.has(id)) return false
    seen.add(id)
    if (seen.size > limit) seen.delete(seen.values().next().value!)
    return true
  }
}
