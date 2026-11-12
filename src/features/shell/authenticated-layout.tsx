import { useLocation, Navigate, Outlet } from 'react-router-dom'
import { useMe } from '@/features/me'
import { returnTo, selectStatus, useSessionStore } from '@/lib/session'
import { BootError } from '@/shared/boot-error'
import { LoadingScreen } from '@/shared/loading-screen'
import { ConnectionBanner } from './connection-banner'

/**
 * App connectée : sans session, ou tant que l'onboarding n'est pas terminé (`MeView.onboardingCompleted`), retour sur
 * `/welcome` ; la page demandée est rouverte ensuite.
 */
export function AuthenticatedLayout() {
  const status = useSessionStore(selectStatus)
  const location = useLocation()
  const me = useMe()

  if (status === 'loading') return <LoadingScreen />
  if (status !== 'authenticated' || me.data?.onboardingCompleted === false) {
    returnTo.remember(`${location.pathname}${location.search}`)
    return <Navigate to="/welcome" replace />
  }
  if (me.isError && !me.data) return <BootError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (!me.data) return <LoadingScreen />

  return (
    <ConnectionBanner>
      <Outlet />
    </ConnectionBanner>
  )
}
