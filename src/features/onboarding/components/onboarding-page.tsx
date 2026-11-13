import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMe } from '@/features/me'
import { continueUrl, dismissEndReason, loginRedirect, returnTo, selectEndReason, selectStatus, useSessionStore } from '@/lib/session'
import { BootError } from '@/shared/boot-error'
import { LoadingScreen } from '@/shared/loading-screen'
import { toCategoryCode } from '@/shared/topics'
import { useOnboardingStore } from '../onboarding-store'
import { BirthDateStep } from './birth-date-step'
import { CodeStep } from './code-step'
import { FirstTopicStep } from './first-topic-step'
import { LoginStep } from './login-step'
import { NotificationsStep } from './notifications-step'
import { SessionEnded } from './session-ended'
import { UniversesStep } from './universes-step'

/**
 * Parcours d'entrée (`/welcome`, `specs/screens/onboarding.md`, sans splash sur le web). Sans session : fin de session
 * subie, puis Connexion et Code. Avec session, tant que `MeView.onboardingCompleted` est faux : Univers, Notifications,
 * Premier thème. Un joueur déjà inscrit passe directement à la page demandée.
 *
 * Retours d'identity : `?continue=` (autorisation d'un client tiers, reprise après la connexion) et `?social=success`
 * (connexion sociale réussie : on enchaîne le PKCE).
 */
export function OnboardingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const status = useSessionStore(selectStatus)
  const endReason = useSessionStore(selectEndReason)
  const me = useMe()
  const step = useOnboardingStore((state) => state.step)
  const go = useOnboardingStore((state) => state.go)
  const setUniverses = useOnboardingStore((state) => state.setUniverses)
  const social = params.get('social') === 'success'

  useEffect(() => {
    if (params.has('continue')) continueUrl.accept(params.get('continue'))
    if (social && !continueUrl.resume()) void loginRedirect()
  }, [params, social])

  const authenticated = status === 'authenticated'
  const onboarded = me.data?.onboardingCompleted ?? false
  const interests = me.data?.interests

  // Arrivée connectée sur un parcours inachevé : reprise à Univers, avec les choix déjà enregistrés.
  const resumed = useRef(false)
  useEffect(() => {
    if (!authenticated) {
      resumed.current = false
      return
    }
    if (resumed.current || !interests || onboarded) return
    resumed.current = true
    setUniverses(interests.map(toCategoryCode))
    go('universes')
  }, [authenticated, interests, onboarded, setUniverses, go])

  // Parcours terminé ou joueur déjà inscrit : la page demandée avant la connexion, sinon l'Accueil.
  const left = useRef(false)
  useEffect(() => {
    if (!authenticated || !onboarded || social || left.current) return
    left.current = true
    if (!continueUrl.resume()) void navigate(returnTo.consume(), { replace: true })
  }, [authenticated, onboarded, social, navigate])

  if (status === 'loading' || social) return <LoadingScreen />

  if (!authenticated) {
    if (endReason) {
      return (
        <SessionEnded
          reason={endReason}
          onLogin={() => {
            dismissEndReason()
            go('login')
          }}
        />
      )
    }
    return step === 'code' ? <CodeStep /> : <LoginStep />
  }

  if (me.isError && !me.data) return <BootError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (!me.data || onboarded) return <LoadingScreen />
  // Étape de compte, avant la personnalisation : une fois, pour les comptes récents (`onboarding.md`).
  if (me.data.birthDateRequired) return <BirthDateStep />

  switch (step) {
    case 'notifications':
      return <NotificationsStep />
    case 'first':
      return <FirstTopicStep />
    default:
      return <UniversesStep />
  }
}
