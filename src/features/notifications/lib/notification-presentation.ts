import { CheckIcon, FlagIcon, LightningIcon, ShieldWarningIcon, SwordIcon, UserPlusIcon, WarningIcon, XIcon, type Icon } from '@phosphor-icons/react'
import type { MessageKey } from '@/lib/i18n'
import type { NotificationView } from '@/lib/realtime'

/** Pictogramme des notifications sans joueur. */
export const NOTIFICATION_ICONS: Record<NotificationView['type'], Icon> = {
  FOLLOW: UserPlusIcon,
  CHALLENGE_RECEIVED: SwordIcon,
  CHALLENGE_DECLINED: XIcon,
  ROOM_ACCEPTED: CheckIcon,
  WIZZ: LightningIcon,
  QUESTION_REPORTED: FlagIcon,
  TOPIC_DRAFTED: WarningIcon,
  ACCOUNT_SUSPENDED: ShieldWarningIcon,
}

const TITLES: Record<NotificationView['type'], MessageKey> = {
  FOLLOW: 'notifications.follow',
  CHALLENGE_RECEIVED: 'notifications.challenge',
  CHALLENGE_DECLINED: 'notifications.declined',
  ROOM_ACCEPTED: 'notifications.accepted',
  WIZZ: 'notifications.wizz',
  QUESTION_REPORTED: 'notifications.reported',
  TOPIC_DRAFTED: 'notifications.drafted',
  ACCOUNT_SUSPENDED: 'notifications.suspended',
}

/** Libellé d'une notification (boîte et toast) ; une revanche a le sien. */
export function notificationTitleKey(notification: Pick<NotificationView, 'type' | 'gameId'>): MessageKey {
  return notification.type === 'CHALLENGE_RECEIVED' && notification.gameId ? 'notifications.rematch' : TITLES[notification.type]
}

/** Joueur à l'origine affiché ; un signalement reste anonyme : jamais le nom ni l'avatar. */
export const notificationActorId = (notification: Pick<NotificationView, 'type' | 'actorId'>) =>
  notification.type === 'QUESTION_REPORTED' ? null : notification.actorId
