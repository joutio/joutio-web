import { useRemoveNotification } from '@joutio/client/notifications'
import { useProfile } from '@joutio/client/profile'
import { useMyRooms } from '@joutio/client/rooms'
import { BellIcon } from '@phosphor-icons/react'
import { useLanguageStore, useT } from '@/lib/i18n'
import type { NotificationView } from '@joutio/client/notifications'
import { readServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { useDuration } from '@/shared/duration'
import { tierOf } from '@/shared/tier'
import { topicName } from '@/shared/topics'
import { NotificationRow } from '@/ui'
import { toast } from '@/shared/toast'
import { useOpenNotification } from '../hooks/use-notifications'
import { NOTIFICATION_ICONS, notificationActorId, notificationTitleKey } from '../lib/notification-presentation'
import { opensScreen } from '../lib/notification-target'
import { isExpired, isUnread } from '../lib/inbox'
import { selectUserId, useSessionStore } from '@/lib/session'

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
  const remove = useRemoveNotification()
  const relative = useRelativeTime()
  const duration = useDuration()
  const actorId = notificationActorId(notification)
  const actor = useProfile(actorId ?? undefined).data
  const src = useUserAvatar(actor)
  // Défi reçu : sa salle (`sourceId`), parmi les salles du joueur poussées par la vue vivante `my-rooms`.
  const rooms = useMyRooms(useSessionStore(selectUserId) ?? undefined).data
  const challenge = notification.type === 'CHALLENGE_RECEIVED' ? rooms?.find((room) => room.roomId === notification.sourceId) : undefined

  const name = actor?.pseudonym ?? t('notifications.somePlayer')
  const title = t(notificationTitleKey(notification), { name })
  const now = readServerNow()
  const pending = challenge?.status === 'INVITED' && !isExpired(notification, now)
  const when = relative(notification.createdAt, now)
  const sub = challenge
    ? `${topicName(challenge.topic.names, language)} · ${pending ? t('challenges.expiresIn', { duration: duration(Date.parse(challenge.expiresAt) - now) }) : when}`
    : when

  return (
    <NotificationRow
      title={title}
      sub={sub}
      icon={actorId ? undefined : (NOTIFICATION_ICONS[notification.type] ?? BellIcon)}
      player={actorId ? { name, src, tier: actor?.progression ? tierOf(actor.progression.rating) : undefined } : undefined}
      unread={isUnread(notification)}
      chevron={opensScreen(notification.type)}
      onClick={() => open(notification)}
      onDelete={() => remove.mutate(notification.notificationId, { onError: () => toast.error(t('notifications.deleteError'), t('home.errorText')) })}
      last={last}
    />
  )
}
