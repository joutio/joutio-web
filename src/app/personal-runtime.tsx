import { Outlet } from 'react-router-dom'
import { RematchHost, useChallengesRuntime } from '@/features/challenges'
import { useNotificationsRuntime } from '@/features/notifications'
import { OngoingRuntime } from '@/features/ongoing'
import { PremiumHost } from '@/features/premium'
import { useRealtimeInvalidation } from './realtime-invalidation'

/**
 * Flux personnel de l'app connectée, monté une fois : chaque événement poussé relit les vues qu'il touche
 * (`useRealtimeInvalidation`, table unique), pastille de l'onglet Défis, toasts. Aucun polling. Porte aussi la feuille
 * Premium, ouverte de partout, et le bandeau « Partie en cours ».
 */
export function PersonalRuntime() {
  useRealtimeInvalidation()
  useChallengesRuntime()
  useNotificationsRuntime()
  return (
    <>
      <OngoingRuntime>
        <Outlet />
      </OngoingRuntime>
      {/* Demandes de revanche reçues, au-dessus de toute page (sauf pendant un duel). */}
      <RematchHost />
      <PremiumHost />
    </>
  )
}
