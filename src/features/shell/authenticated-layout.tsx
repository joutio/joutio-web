import { useEffect, useRef } from 'react'
import { useLocation, Navigate, Outlet } from 'react-router-dom'
import { useApplyReferral, useMe } from '@/features/me'
import { BirthDateStep } from '@/features/onboarding'
import { returnTo, selectStatus, useSessionStore } from '@/lib/session'
import { BootError } from '@/shared/boot-error'
import { LoadingScreen } from '@/shared/loading-screen'
import { pendingReferral } from '@/shared/pending-referral'
import { ConnectionBanner } from './connection-banner'

/**
 * App connectée : sans session, ou tant que l'onboarding n'est pas terminé (`MeView.onboardingCompleted`), retour sur
 * `/welcome` ; la page demandée est rouverte ensuite.
 */
export function AuthenticatedLayout() {
  const status = useSessionStore(selectStatus)
  const location = useLocation()
  const me = useMe()
  const applyReferral = useApplyReferral()
  const applied = useRef(false)
  const required = me.data?.birthDateRequired === true

  // Code de parrainage reçu par un lien avant la connexion : appliqué une fois, en silence (`partage.md` § 6).
  useEffect(() => {
    if (applied.current || !me.data || required) return
    const code = pendingReferral.peek()
    if (!code) return
    applied.current = true
    pendingReferral.clear()
    applyReferral.mutate(code)
  }, [me.data, required, applyReferral])

  if (status === 'loading') return <LoadingScreen />
  if (status !== 'authenticated' || me.data?.onboardingCompleted === false) {
    returnTo.remember(`${location.pathname}${location.search}`)
    return <Navigate to="/welcome" replace />
  }
  if (me.isError && !me.data) return <BootError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (!me.data) return <LoadingScreen />

  // Compte récent sans date de naissance (lien de salon, reprise) : demandée avant de jouer.
  if (required) return <BirthDateStep />

  return (
    <ConnectionBanner>
      <Outlet />
    </ConnectionBanner>
  )
}
