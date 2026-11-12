import { Outlet } from 'react-router-dom'
import { useChallengesRuntime } from '@/features/challenges'
import { useNotificationsRuntime } from '@/features/notifications'

/**
 * Flux personnel de l'app connectée, monté une fois : défis et salons relus à chaque défi reçu, refusé ou accepté
 * (pastille de l'onglet Défis), boîte et cloche relues à chaque notification. Aucun polling.
 */
export function PersonalRuntime() {
  useChallengesRuntime()
  useNotificationsRuntime()
  return <Outlet />
}
