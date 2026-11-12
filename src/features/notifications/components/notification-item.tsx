import type { ChallengeView } from '@joutio/client-domain/api-types'
import { BellIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { usePlayerProfile } from '@/features/player'
import { useLanguageStore, useT } from '@/lib/i18n'
import { queryKeys } from '@/lib/query-keys'
import type { NotificationView } from '@/lib/realtime'
import { readServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { useDuration } from '@/shared/duration'
import { tierOf } from '@/shared/tier'
import { topicName } from '@/shared/topics'
import { NotificationRow } from '@/ui'
import { useDeleteNotification, useOpenNotification } from '../hooks/use-notifications'
import { NOTIFICATION_ICONS, notificationActorId, notificationTitleKey } from '../lib/notification-presentation'
import { isExpired, isUnread } from '../lib/notifications-service'

/** Délai écoulé : « à l'instant », « il y a 12 min », « il y a 3 h », « il y a 2 j », puis la date. */
function useRelativeTime() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  return (iso: string, now: number) => {
    const minutes = Math.floor((now - Date.parse(iso)) / 60_000)
    if (minutes < 1) return t('notifications.justNow')
    if (minutes < 60) return t('presence.minutes', { count: minutes })
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return t('presence.hours', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('presence.days', { count: days })
    return new Date(iso).toLocaleDateString(language, { day: 'numeric', month: 'short' })
  }
}

/**
 * Une notification : joueur à l'origine (fiche en cache) ou pictogramme, titre et contexte. Toucher marque comme lue
 * puis ouvre l'écran de l'action ; balayer supprime. Un signalement reste anonyme : jamais le nom ni l'avatar.
 */
export function NotificationItem({ notification, last }: { notification: NotificationView; last: boolean }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const open = useOpenNotification()
  const remove = useDeleteNotification()
  const relative = useRelativeTime()
  const duration = useDuration()
  const actorId = notificationActorId(notification)
  const actor = usePlayerProfile(actorId ?? '').data
  const src = useUserAvatar(actor)
  // Défis tenus à jour par le runtime (badge de l'onglet) : lus en cache, sans requête de plus.
  const challenges = useQuery<ChallengeView[]>({ queryKey: queryKeys.challenges, enabled: false }).data
  const challenge = notification.type === 'CHALLENGE_RECEIVED' ? challenges?.find((item) => item.challengeId === notification.sourceId) : undefined

  const name = actor?.pseudonym ?? t('notifications.somePlayer')
  const title = t(notificationTitleKey(notification), { name })
  const now = readServerNow()
  const pending = challenge?.status === 'PENDING' && !isExpired(notification, now)
  const when = relative(notification.createdAt, now)
  const sub = challenge
    ? `${topicName(challenge.topic.names, language)} · ${pending ? t('challenges.expiresIn', { duration: duration(Date.parse(challenge.expiresAt) - now) }) : when}`
    : when

  return (
    <NotificationRow
      title={title}
      sub={sub}
      icon={actorId ? undefined : (NOTIFICATION_ICONS[notification.type] ?? BellIcon)}
      player={actorId ? { name, src, tier: actor?.progression && !actor.progression.provisional ? tierOf(actor.progression.rating) : undefined } : undefined}
      unread={isUnread(notification)}
      onClick={() => open(notification)}
      onDelete={() => remove.mutate(notification.notificationId)}
      last={last}
    />
  )
}
