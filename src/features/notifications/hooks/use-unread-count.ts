import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { notificationsService } from '../lib/notifications-service'

/** Notifications non lues : badge de la cloche. */
export function useUnreadCount() {
  return useQuery({ queryKey: queryKeys.notifications.unreadCount, queryFn: notificationsService.unreadCount, staleTime: 30_000 })
}
