import { useDefisBadge } from '@joutio/client/rooms'
import { useEffect } from 'react'
import { useTabBadges } from '@/features/shell'
import { selectUserId, useSessionStore } from '@/lib/session'

/**
 * Pastille de l'onglet Défis (`useDefisBadge` : défis reçus en attente + salles où l'adversaire attend le joueur),
 * poussée par la vue vivante `my-rooms`. Monté une fois pour toute l'app connectée.
 */
export function useChallengesBadge() {
  const count = useDefisBadge(useSessionStore(selectUserId) ?? undefined).data ?? 0
  const setBadge = useTabBadges((state) => state.set)
  useEffect(() => setBadge('challenges', count), [count, setBadge])
}
