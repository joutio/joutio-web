import { useQuery } from '@tanstack/react-query'
import { unreadCountQuery } from '@joutio/client/query'
import { api } from '@/lib/api'

/** Notifications non lues : badge de la cloche. */
export function useUnreadCount() {
  return useQuery({ ...unreadCountQuery(api), staleTime: 30_000 })
}
