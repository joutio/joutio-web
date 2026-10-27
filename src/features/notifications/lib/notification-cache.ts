import type { QueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { Page } from "@/shared/types/api"
import type { NotificationView } from "@/shared/types/notifications"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import { notificationsService } from "./notifications"

interface UnreadCountView {
  count: number
}

function isNotificationPage(value: unknown): value is Page<NotificationView> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Page<NotificationView>).content)
  )
}

/**
 * Retire une notification de toutes les vues inbox en cache (page `/notifications` + panneau de
 * la cloche) et décrémente le compteur non lus si elle était non lue. Utilisé par la mutation de
 * suppression (optimiste) et par le push WS `NOTIFICATION_DELETED` (autres onglets).
 */
export function removeNotificationFromCaches(
  queryClient: QueryClient,
  notificationId: string
): void {
  const entries = queryClient.getQueriesData({
    queryKey: queryKeys.notifications.all,
  })
  let wasUnread = false

  for (const [key, data] of entries) {
    if (!isNotificationPage(data)) continue
    const item = data.content.find((n) => n.notificationId === notificationId)
    if (!item) continue
    if (!item.readAt) wasUnread = true
    const totalElements = Math.max(0, data.totalElements - 1)
    const totalPages = data.size > 0 ? Math.ceil(totalElements / data.size) : 0
    queryClient.setQueryData<Page<NotificationView>>(key, {
      ...data,
      content: data.content.filter((n) => n.notificationId !== notificationId),
      totalElements,
      totalPages,
      first: data.page === 0,
      last: data.page >= totalPages - 1,
    })
  }

  if (wasUnread) {
    queryClient.setQueryData<UnreadCountView>(
      queryKeys.notifications.unreadCount(),
      (current) =>
        current ? { count: Math.max(0, current.count - 1) } : current
    )
  }
}

/** Vrai pour une page filtrée « non lues » (la notification lue doit en sortir). */
function isUnreadOnlyListKey(key: readonly unknown[]): boolean {
  if (key[0] !== "notifications" || key[1] !== "list") return false
  const params = key[2] as { unreadOnly?: boolean } | undefined
  return params?.unreadOnly === true
}

/**
 * Marque une notification comme lue dans **toutes** les vues inbox en cache et décrémente le
 * compteur non lus. Une page filtrée « non lues » retire la ligne (elle ne doit plus y figurer),
 * les autres pages renseignent `readAt`.
 *
 * <p>Aucune invalidation n'est déclenchée après le succès : la projection Axon peut être en retard
 * et réécrire l'ancien `readAt` dans le cache. L'état optimiste est la vérité locale, le prochain
 * rafraîchissement (15 s) convergera.</p>
 */
export function markNotificationReadInCaches(
  queryClient: QueryClient,
  notificationId: string
): void {
  const entries = queryClient.getQueriesData({
    queryKey: queryKeys.notifications.all,
  })
  const readAt = new Date().toISOString()
  let wasUnread = false

  for (const [key, data] of entries) {
    if (!isNotificationPage(data)) continue
    const item = data.content.find((n) => n.notificationId === notificationId)
    if (!item || item.readAt) continue
    wasUnread = true

    if (isUnreadOnlyListKey(key)) {
      const totalElements = Math.max(0, data.totalElements - 1)
      const totalPages =
        data.size > 0 ? Math.ceil(totalElements / data.size) : 0
      queryClient.setQueryData<Page<NotificationView>>(key, {
        ...data,
        content: data.content.filter(
          (notification) => notification.notificationId !== notificationId
        ),
        totalElements,
        totalPages,
        first: data.page === 0,
        last: data.page >= totalPages - 1,
      })
      continue
    }

    queryClient.setQueryData<Page<NotificationView>>(key, {
      ...data,
      content: data.content.map((notification) =>
        notification.notificationId === notificationId
          ? { ...notification, readAt }
          : notification
      ),
    })
  }

  if (wasUnread) {
    queryClient.setQueryData<UnreadCountView>(
      queryKeys.notifications.unreadCount(),
      (current) =>
        current ? { count: Math.max(0, current.count - 1) } : current
    )
  }
}

/**
 * Vide toutes les vues inbox en cache (pages `/notifications` + panneau de la cloche) et remet
 * le compteur non lus à zéro. Utilisé par la suppression totale (optimiste).
 */
export function clearNotificationsFromCaches(queryClient: QueryClient): void {
  const entries = queryClient.getQueriesData({
    queryKey: queryKeys.notifications.all,
  })

  for (const [key, data] of entries) {
    if (!isNotificationPage(data)) continue
    queryClient.setQueryData<Page<NotificationView>>(key, {
      ...data,
      content: [],
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    })
  }

  queryClient.setQueryData<UnreadCountView>(
    queryKeys.notifications.unreadCount(),
    { count: 0 }
  )
}

/**
 * Réconcilie l'inbox avec la projection (différée) **jusqu'à convergence** : on relit la première
 * page via le service tant que `matches` n'est pas vrai, puis on invalide les vues (aucune valeur
 * périmée n'est écrite dans le cache). En secours au timeout, invalidation simple.
 */
export async function reconcileNotifications(
  queryClient: QueryClient,
  matches: (latest: Page<NotificationView>) => boolean
): Promise<void> {
  await reconcileUntil<Page<NotificationView>>({
    read: () =>
      notificationsService.list({ unreadOnly: false, page: 0, size: 20 }),
    matches,
    onConverged: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
    },
    onTimeout: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
    },
  })
}
