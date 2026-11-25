import { useNotifications, useReadAllNotifications, useRemoveAllNotifications, type NotificationView } from '@joutio/client/notifications'
import { useMyRooms, type RoomView } from '@joutio/client/rooms'
import { BellIcon, ChecksIcon, TrashIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { TabNav } from '@/features/shell'
import { useT, type MessageKey } from '@/lib/i18n'
import { readServerNow } from '@/lib/realtime'
import { showDialog } from '@/shared/dialog'
import { feedFooterProps } from '@/shared/paging'
import { ROUTES } from '@/shared/routes'
import { Button, EmptyState, FeedFooter, IconButton, MobileTopBar, Screen, SectionHeader, Skeleton } from '@/ui'
import { toast } from '@/shared/toast'
import { dayOf, isExpired, isUnread, type NotificationDay } from '../lib/inbox'
import { NotificationItem } from './notification-item'

const DAY_LABELS: Record<NotificationDay, MessageKey> = { today: 'notifications.today', week: 'notifications.week', older: 'notifications.older' }

function Loading() {
  const t = useT()
  return (
    <div className="grid gap-2 px-4 pt-1 pb-6" aria-label={t('common.loading')}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} shape="row" className="h-16" />
      ))}
    </div>
  )
}

/**
 * Sections consécutives sur les éléments chargés (l'ordre du flux fait foi, une page prolonge le dernier groupe). Dans
 * une section, les défis reçus encore ouverts remontent en tête : eux seuls attendent une réponse.
 */
function groupByDay(items: readonly NotificationView[], rooms: readonly RoomView[] | undefined) {
  const now = readServerNow()
  const today = new Date(now)
  const waiting = (item: NotificationView) =>
    item.type === 'CHALLENGE_RECEIVED' && isUnread(item) && !isExpired(item, now) && rooms?.find((room) => room.roomId === item.sourceId)?.status !== 'WAITING_PLAYERS'
  const groups: { day: NotificationDay; items: NotificationView[] }[] = []
  for (const item of items) {
    const day = dayOf(item.createdAt, today)
    const last = groups[groups.length - 1]
    if (last?.day === day) last.items.push(item)
    else groups.push({ day, items: [item] })
  }
  return groups.map((group) => ({ ...group, items: [...group.items.filter(waiting), ...group.items.filter((item) => !waiting(item))] }))
}

/**
 * Notifications (`design/specs/screens/notifications.md`, lab `/screens/notifications?view=compact`) : écran poussé par
 * la cloche, onglet Accueil actif. Tout marquer comme lu, Tout supprimer (confirmé), sections Aujourd'hui / Cette
 * semaine / Plus ancien, 10 par page. Toucher ouvre l'écran de l'action ; balayer supprime. Tenu à jour par le flux
 * personnel.
 */
export function NotificationsPage() {
  const t = useT()
  const navigate = useNavigate()
  const inbox = useNotifications()
  const readAll = useReadAllNotifications()
  const removeAll = useRemoveAllNotifications()
  const rooms = useMyRooms().data
  const items = inbox.data?.pages.flatMap((page) => page.content) ?? []
  const failed = inbox.isError
  const anyUnread = items.some(isUnread)
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.home, { replace: true }))

  const confirmClear = () =>
    showDialog({
      sheet: true,
      tone: 'danger',
      icon: TrashIcon,
      title: t('notifications.clearTitle'),
      message: t('notifications.clearText'),
      actions: [
        { label: t('notifications.clear'), variant: 'filled', tone: 'destructive', onClick: () => removeAll.mutate(undefined, { onError: () => toast.error(t('notifications.deleteAllError'), t('home.errorText')) }) },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  return (
    <Screen
      header={
        <MobileTopBar
          variant="inline"
          back={t('nav.home')}
          title={t('home.notifications')}
          onBack={back}
          right={
            <>
              <IconButton icon={ChecksIcon} label={t('notifications.readAll')} variant="plain" tone="accent" disabled={!anyUnread} onClick={() => readAll.mutate(undefined, { onError: () => toast.error(t('notifications.readAllError'), t('home.errorText')) })} />
              <IconButton icon={TrashIcon} label={t('notifications.clear')} variant="plain" tone="destructive" disabled={inbox.isPending || failed || items.length === 0} onClick={confirmClear} />
            </>
          }
        />
      }
      bottomNav={<TabNav active="home" />}
    >
      {inbox.isPending && <Loading />}
      {failed && (
        <EmptyState
          className="pt-16"
          icon={WarningCircleIcon}
          title={t('notifications.errorTitle')}
          description={t('home.errorText')}
          action={
            <Button loading={inbox.isRefetching} onClick={() => void inbox.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      )}
      {inbox.isSuccess && items.length === 0 && <EmptyState className="pt-16" icon={BellIcon} title={t('notifications.emptyTitle')} description={t('notifications.emptyText')} />}
      {!failed && items.length > 0 && (
        <div className="grid gap-6 px-4 pt-1 pb-8">
          {groupByDay(items, rooms).map(({ day, items: group }) => (
            <section key={day} className="grid gap-3">
              <SectionHeader title={t(DAY_LABELS[day])} />
              <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
                {group.map((notification, index) => (
                  <NotificationItem key={notification.notificationId} notification={notification} last={index === group.length - 1} />
                ))}
              </div>
            </section>
          ))}
          <FeedFooter {...feedFooterProps(inbox)} endLabel={t('notifications.end')} />
        </div>
      )}
    </Screen>
  )
}
