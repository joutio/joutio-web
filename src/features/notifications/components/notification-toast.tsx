import { usePlayerProfile } from '@/features/player'
import { useT } from '@/lib/i18n'
import type { NotificationView } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { tierOf } from '@/shared/tier'
import { Toast } from '@/ui'
import { NOTIFICATION_ICONS, notificationActorId, notificationTitleKey } from '../lib/notification-presentation'

/** Toast d'une notification reçue : avatar du joueur à l'origine (ou pictogramme), même libellé que la boîte ; touchable. */
export function NotificationToast({ notification, onOpen }: { notification: NotificationView; onOpen: () => void }) {
  const t = useT()
  const actorId = notificationActorId(notification)
  const actor = usePlayerProfile(actorId ?? '').data
  const src = useUserAvatar(actor)
  const name = actor?.pseudonym ?? t('notifications.somePlayer')
  return (
    <Toast
      title={t(notificationTitleKey(notification), { name })}
      icon={NOTIFICATION_ICONS[notification.type]}
      actor={actorId ? { name, src, tier: actor?.progression && !actor.progression.provisional ? tierOf(actor.progression.rating) : undefined } : undefined}
      onClick={onOpen}
    />
  )
}
