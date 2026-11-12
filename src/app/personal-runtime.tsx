import { Outlet } from 'react-router-dom'
import { useChallengesRuntime } from '@/features/challenges'
import { useNotificationsRuntime } from '@/features/notifications'
import { OngoingRuntime } from '@/features/ongoing'
import { PremiumHost } from '@/features/premium'

/**
 * Flux personnel de l'app connectée, monté une fois : défis et salons relus à chaque défi reçu, refusé ou accepté
 * (pastille de l'onglet Défis), boîte et cloche relues à chaque notification. Aucun polling. Porte aussi la feuille
 * Premium, ouverte de partout, et le bandeau « Partie en cours ».
 */
export function PersonalRuntime() {
  useChallengesRuntime()
  useNotificationsRuntime()
  return (
    <>
      <OngoingRuntime>
        <Outlet />
      </OngoingRuntime>
      <PremiumHost />
    </>
  )
}
