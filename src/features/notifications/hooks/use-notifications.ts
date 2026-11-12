import type { PageResponse } from '@joutio/client-domain/api-types'
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useT, type MessageKey } from '@/lib/i18n'
import { optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { usePersonalNotifications, type NotificationView } from '@/lib/realtime'
import { endSession } from '@/lib/session'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { notificationTarget } from '../lib/notification-target'
import { notificationsService } from '../lib/notifications-service'

type Pages = InfiniteData<PageResponse<NotificationView>, number>

/** Boîte de réception, 10 par page. */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: ({ pageParam }) => notificationsService.page(pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
    staleTime: 15_000,
  })
}

/**
 * Flux personnel STOMP : une notification créée relit la boîte et le compteur de la cloche ; une suppression (autre
 * appareil) la retire sur place. Aucun polling. Monté une fois pour toute l'app connectée.
 */
export function useNotificationsRuntime() {
  const client = useQueryClient()
  const userId = useMe().data?.userId
  usePersonalNotifications(userId, (notification, deleted) => {
    if (!deleted) {
      void client.invalidateQueries({ queryKey: queryKeys.notifications.all })
      return
    }
    const data = client.getQueryData<Pages>(queryKeys.notifications.list)
    const existing = data?.pages.flatMap((page) => page.content).find((item) => item.notificationId === notification.notificationId)
    if (!existing) return
    client.setQueryData<Pages>(queryKeys.notifications.list, (current) =>
      current
        ? {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              content: page.content.filter((item) => item.notificationId !== notification.notificationId),
              totalElements: Math.max(0, page.totalElements - 1),
            })),
          }
        : current,
    )
    if (existing.readAt === null)
      client.setQueryData<{ count: number }>(queryKeys.notifications.unreadCount, (count) => (count ? { count: Math.max(0, count.count - 1) } : count))
  })
}

/** Change la liste et le compteur en cache tout de suite ; restaurés si le BFF refuse. */
function useInboxMutation<V>(run: (value: V) => Promise<unknown>, change: (list: NotificationView[], value: V) => NotificationView[], error: MessageKey, all: false | 'read' | 'delete' = false) {
  const client = useQueryClient()
  const t = useT()
  const listKey = queryKeys.notifications.list
  const countKey = queryKeys.notifications.unreadCount
  return useMutation({
    mutationFn: run,
    onMutate: (value: V) =>
      optimisticUpdate(client, [queryKeys.notifications.all], () => {
        const previous = client.getQueryData<Pages>(listKey)
        const previousCount = client.getQueryData<{ count: number }>(countKey)
        if (!previous) {
          if (all) client.setQueryData(countKey, { count: 0 })
          return
        }
        const contents = previous.pages.map((page) => change(page.content, value))
        const removed = previous.pages.reduce((sum, page, index) => sum + page.content.length - (contents[index]?.length ?? 0), 0)
        const next: Pages = {
          ...previous,
          pages: previous.pages.map((page, index) => {
            const total = all === 'delete' ? 0 : Math.max(0, page.totalElements - removed)
            return { ...page, content: contents[index] ?? [], totalElements: total, totalPages: Math.ceil(total / page.size), last: all === 'delete' ? true : page.last }
          }),
        }
        client.setQueryData<Pages>(listKey, next)
        const unread = (pages: Pages) => pages.pages.flatMap((page) => page.content).filter((item) => item.readAt === null).length
        if (previousCount) client.setQueryData(countKey, { count: all ? 0 : Math.max(0, previousCount.count - (unread(previous) - unread(next))) })
      }),
    onError: (_error, _value, context) => {
      context?.rollback()
      toast.error(t(error), t('home.errorText'))
    },
  })
}

const now = () => new Date().toISOString()

export const useMarkRead = () =>
  useInboxMutation(
    (notificationId: string) => notificationsService.read(notificationId),
    (list, notificationId) => list.map((item) => (item.notificationId === notificationId && item.readAt === null ? { ...item, readAt: now() } : item)),
    'notifications.readError',
  )

export const useMarkAllRead = () =>
  useInboxMutation(
    (_: void) => notificationsService.readAll(),
    (list) => list.map((item) => (item.readAt === null ? { ...item, readAt: now() } : item)),
    'notifications.readAllError',
    'read',
  )

export const useDeleteNotification = () =>
  useInboxMutation(
    (notificationId: string) => notificationsService.remove(notificationId),
    (list, notificationId) => list.filter((item) => item.notificationId !== notificationId),
    'notifications.deleteError',
  )

export const useDeleteAllNotifications = () =>
  useInboxMutation(
    (_: void) => notificationsService.removeAll(),
    () => [],
    'notifications.deleteAllError',
    'delete',
  )

/** Toucher une notification : marquée lue, puis l'écran qui propose l'action s'ouvre (`notifications.md` § 2). */
export function useOpenNotification() {
  const t = useT()
  const navigate = useNavigate()
  const read = useMarkRead()
  return (notice: NotificationView) => {
    if (notice.readAt === null) read.mutate(notice.notificationId)
    const target = notificationTarget(notice)
    switch (target.kind) {
      case 'player':
        return void navigate(ROUTES.player(target.id))
      case 'challenges':
        return void navigate(ROUTES.challenges)
      case 'room':
        return void navigate(ROUTES.room(target.id))
      case 'workshop':
        // L'atelier (écran 11) n'est pas encore porté : Mes sujets en écran d'attente.
        return void navigate(ROUTES.myTopics)
      case 'suspended':
        return void endSession('suspended')
      case 'fallback':
        if (target.challenges) void navigate(ROUTES.challenges)
        toast.info(t(target.expired ? 'notifications.expired' : 'notifications.unavailable'))
    }
  }
}
