import { useLocation, Navigate, Outlet } from 'react-router-dom'
import { returnTo, selectStatus, useSessionStore } from '@/lib/session'
import { ConnectionBanner } from './connection-banner'

/** App connectée : sans session, retour à l'onboarding, la page demandée est rouverte après la connexion. */
export function AuthenticatedLayout() {
  const status = useSessionStore(selectStatus)
  const location = useLocation()
  if (status !== 'authenticated') {
    returnTo.remember(`${location.pathname}${location.search}`)
    return <Navigate to="/welcome" replace />
  }
  return (
    <ConnectionBanner>
      <Outlet />
    </ConnectionBanner>
  )
}
