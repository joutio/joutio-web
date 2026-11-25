import { parseEnvelope, useSubscription } from '@joutio/client/core'
import { useReadNotification, type NotificationView } from '@joutio/client/notifications'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { endSession } from '@/lib/session'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { NotificationToast } from '../components/notification-toast'
import { createNotificationDeduplicator, notificationTarget, shouldToast } from '../lib/notification-target'

type Frame = { deleted: boolean; notification: NotificationView }

/** Trame du flux personnel : notification créée ou supprimée (les autres trames sont ignorées). */
function readFrame(body: string): Frame | undefined {
  const frame = parseEnvelope(body) as { eventType?: string; payload?: NotificationView } | undefined
  if (!frame?.payload?.notificationId) return undefined
  return { deleted: frame.eventType === 'NOTIFICATION_DELETED', notification: frame.payload }
}

/**
 * Toasts du flux personnel (`toast.md`) : une notification créée s'annonce par un toast touchable, une suppression
 * (autre appareil) ferme le sien. La boîte et la cloche suivent par `useJoutioSync`. Monté une fois pour toute l'app
 * connectée ; `userId` absent : aucun abonnement.
 */
export function useNotificationsRuntime(userId: string | undefined) {
  const open = useOpenNotification()
  const latestOpen = useRef(open)
  useEffect(() => {
    latestOpen.current = open
  })
  const dedupe = useRef(createNotificationDeduplicator())

  useSubscription(userId ? `/topic/notifications/${userId}` : undefined, readFrame, ({ deleted, notification }) => {
    const id = `notification:${notification.notificationId}`
    if (deleted) return toast.dismiss(id)
    if (!dedupe.current(notification.notificationId)) return
    if (!shouldToast(notification, document.visibilityState === 'visible')) return
    toast.show({ id, content: <NotificationToast notification={notification} onOpen={() => latestOpen.current(notification)} /> })
  })
}

/** Toucher une notification : marquée lue, puis l'écran qui propose l'action s'ouvre (`notifications.md` § 2). */
export function useOpenNotification() {
  const t = useT()
  const navigate = useNavigate()
  const read = useReadNotification()
  return (notice: NotificationView) => {
    if (notice.readAt === null) read.mutate(notice.notificationId, { onError: () => toast.error(t('notifications.readError'), t('home.errorText')) })
    const target = notificationTarget(notice)
    switch (target.kind) {
      case 'player':
        return void navigate(ROUTES.player(target.id))
      case 'challenges':
        return void navigate(ROUTES.challengesTab(target.tab))
      case 'room':
        return void navigate(ROUTES.room(target.id))
      case 'workshop':
        return void navigate(ROUTES.myTopic(target.id))
      case 'report':
        // Signalements de la question, poussés par-dessus la boîte : le retour revient ici (`notifications.md` § 2).
        return void navigate(ROUTES.reportOf(target.topicId, target.reportId), { state: { from: 'notifications' } })
      case 'suspended':
        return void endSession('suspended')
      case 'none':
        return
      case 'fallback':
        if (target.challenges) void navigate(ROUTES.challengesTab(target.challenges))
        toast.info(t(target.expired ? 'notifications.expired' : 'notifications.unavailable'))
    }
  }
}
