import { useJoutioSync } from '@joutio/client/sync'
import { Outlet } from 'react-router-dom'
import { RematchHost, useChallengesBadge } from '@/features/challenges'
import { useNotificationsRuntime } from '@/features/notifications'
import { OngoingRuntime } from '@/features/ongoing'
import { PremiumHost } from '@/features/premium'
import { selectUserId, useSessionStore } from '@/lib/session'

/**
 * App connectée, montée une fois : `useJoutioSync` (`@joutio/client`) tient le cache à jour sur les flux personnels
 * (inbox, salles, succès), la pastille de l'onglet Défis suit les salles, les notifications reçues s'annoncent en toast.
 * Aucun polling. Porte aussi la feuille Premium, ouverte de partout, et le bandeau « Partie en cours ».
 */
export function PersonalRuntime() {
  const userId = useSessionStore(selectUserId) ?? undefined
  useJoutioSync(userId)
  useChallengesBadge()
  useNotificationsRuntime(userId)
  return (
    <>
      <OngoingRuntime>
        <Outlet />
      </OngoingRuntime>
      {/* Revanche reçue, au-dessus de toute page (sauf pendant un duel). */}
      <RematchHost />
      <PremiumHost />
    </>
  )
}
