import { useMe } from '@joutio/client/me'
import { useLocation, Navigate, Outlet } from 'react-router-dom'
import { BirthDateStep, TermsStep } from '@/features/onboarding'
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

  if (status === 'loading') return <LoadingScreen />
  if (status !== 'authenticated') {
    returnTo.remember(`${location.pathname}${location.search}`)
    return <Navigate to="/welcome" replace />
  }
  return <Member />
}

/** Sous session : le compte décide de l'onboarding, de la date de naissance et des CGU avant de jouer. */
function Member() {
  const location = useLocation()
  const me = useMe()

  if (me.data?.onboardingCompleted === false) {
    returnTo.remember(`${location.pathname}${location.search}`)
    return <Navigate to="/welcome" replace />
  }
  if (me.isError && !me.data) return <BootError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (!me.data) return <LoadingScreen />

  // Compte récent sans date de naissance (lien de salon, reprise) : demandée avant de jouer.
  if (me.data.birthDateRequired === true) return <BirthDateStep />
  // CGU en vigueur pas encore acceptées (première connexion ou nouvelle version) : présentées avant de jouer.
  if (me.data.termsUpToDate === false) return <TermsStep />

  return (
    <ConnectionBanner>
      <Outlet />
    </ConnectionBanner>
  )
}
