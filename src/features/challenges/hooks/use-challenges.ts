import { useDefisBadge } from '@joutio/client/rooms'
import { useEffect } from 'react'
import { useTabBadges } from '@/features/shell'

/**
 * Pastille de l'onglet Défis (`useDefisBadge` : défis reçus en attente + salles où l'adversaire attend le joueur),
 * tenue à jour par `useJoutioSync` (`ROOM_STATUS`, `ROOM_PRESENCE`). Monté une fois pour toute l'app connectée.
 */
export function useChallengesBadge() {
  const count = useDefisBadge().data ?? 0
  const setBadge = useTabBadges((state) => state.set)
  useEffect(() => setBadge('challenges', count), [count, setBadge])
}
