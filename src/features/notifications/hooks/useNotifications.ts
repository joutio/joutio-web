import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { NotificationPreferenceView } from "@/shared/types/notifications"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import {
  clearNotificationsFromCaches,
  markNotificationReadInCaches,
  reconcileNotifications,
  removeNotificationFromCaches,
} from "../lib/notification-cache"
import { notificationsService } from "../lib/notifications"

/** Inbox mutable : rafraîchissement périodique (15 s) — le STOMP pousse par ailleurs. */
const INBOX_POLL_MS = 15_000
/** Préférences modifiables : vue mutable, tolérée 30 s (projection Axon différée). */
const PREFERENCES_STALE_MS = 30_000

export interface NotificationListParams {
  unreadOnly: boolean
  page: number
  size: number
}

/** Page d'inbox (paramétrable : la cloche = 20 dernières, la page = filtre + pagination). */
export function useNotifications(params?: Partial<NotificationListParams>) {
  const resolved: NotificationListParams = {
    unreadOnly: params?.unreadOnly ?? false,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  }
  return useQuery({
    queryKey: queryKeys.notifications.list(resolved),
    queryFn: () => notificationsService.list(resolved),
    staleTime: INBOX_POLL_MS,
    refetchInterval: INBOX_POLL_MS,
  })
}

/** Compteur de notifications non lues (badge de la cloche). */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    staleTime: INBOX_POLL_MS,
    refetchInterval: INBOX_POLL_MS,
  })
}

/**
 * Marque une notification comme lue avec un patch **optimiste** de toutes les vues inbox.
 *
 * <p>Pas d'invalidation après succès : la projection Axon peut encore exposer l'ancien `readAt`
 * (et écraserait le patch). Les vues se rafraîchissent d'elles-mêmes (poll 15 s).</p>
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      // Un toast cliqué peut précéder la projection, ou la notification avoir été supprimée
      // ailleurs : l'échec ne doit pas produire un toast d'erreur.
      notificationsService.markRead(notificationId, { skipErrorBus: true }),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      })
      markNotificationReadInCaches(queryClient, notificationId)
      return { previous }
    },
    onError: (_error, _notificationId, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      )
    },
  })
}

/** Repasse une notification en non lue (swipe inversé / menu desktop). */
export function useMarkNotificationUnread() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markUnread(notificationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
    },
  })
}

/**
 * Supprime une notification (swipe action) avec retrait optimiste immédiat de **toutes** les
 * vues inbox (page, cloche, compteur non lus). En cas d'échec, les caches sont restaurés ; la
 * réconciliation avec la projection Axon est différée (2 s).
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.remove(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      })
      removeNotificationFromCaches(queryClient, notificationId)
      return { previous }
    },
    onError: (_error, _notificationId, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      )
    },
    onSettled: (_data, error, notificationId) => {
      if (error) return
      void reconcileNotifications(
        queryClient,
        (page) => !page.content.some((n) => n.notificationId === notificationId)
      )
    },
  })
}

/**
 * Vide toute l'inbox (hard delete) avec purge optimiste de **toutes** les vues (pages, cloche,
 * compteur non lus). En cas d'échec, les caches sont restaurés ; la réconciliation avec la
 * projection Axon est différée (2 s).
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.removeAll(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all })
      const previous = queryClient.getQueriesData({
        queryKey: queryKeys.notifications.all,
      })
      clearNotificationsFromCaches(queryClient)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      )
    },
    onSettled: (_data, error) => {
      if (error) return
      void reconcileNotifications(
        queryClient,
        (page) => page.totalElements === 0
      )
    },
  })
}

/** Marque toute l'inbox comme lue. */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      })
    },
  })
}

/** Préférences persistées (défaut : tout activé). */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationsService.preferences(),
    staleTime: PREFERENCES_STALE_MS,
  })
}

/** Active/désactive une catégorie de notification (optimiste : le switch bascule aussitôt). */
export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      category,
      enabled,
    }: {
      category: Parameters<typeof notificationsService.updatePreference>[0]
      enabled: boolean
    }) => notificationsService.updatePreference(category, enabled),
    onMutate: async ({ category, enabled }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.notifications.preferences(),
      })
      const previous = queryClient.getQueryData<NotificationPreferenceView[]>(
        queryKeys.notifications.preferences()
      )
      queryClient.setQueryData<NotificationPreferenceView[]>(
        queryKeys.notifications.preferences(),
        (current) => {
          if (!current) return current
          const exists = current.some(
            (preference) => preference.category === category
          )
          return exists
            ? current.map((preference) =>
                preference.category === category
                  ? { ...preference, enabled }
                  : preference
              )
            : [...current, { category, enabled }]
        }
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(
          queryKeys.notifications.preferences(),
          context.previous
        )
      }
    },
    onSettled: (_data, error, { category, enabled }) => {
      if (error) return
      // Projection Axon différée : on relit jusqu'à retrouver la préférence choisie.
      void reconcileUntil<NotificationPreferenceView[]>({
        read: () => notificationsService.preferences(),
        matches: (preferences) =>
          preferences.some(
            (preference) =>
              preference.category === category && preference.enabled === enabled
          ),
        onConverged: (preferences) => {
          queryClient.setQueryData(
            queryKeys.notifications.preferences(),
            preferences
          )
        },
        onTimeout: () => {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.notifications.preferences(),
          })
        },
      })
    },
  })
}
