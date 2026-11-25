import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMe } from '@joutio/client/me'
import { dismissEndReason, loginRedirect, returnTo, selectEndReason, selectStatus, useSessionStore } from '@/lib/session'
import { BootError } from '@/shared/boot-error'
import { LoadingScreen } from '@/shared/loading-screen'
import { toCategoryCode } from '@/shared/topics'
import { useOnboardingStore } from '../onboarding-store'
import { BirthDateStep } from './birth-date-step'
import { TermsStep } from './terms-step'
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
 * Retour d'identity : `?social=success` (connexion sociale réussie : on enchaîne le PKCE). Les outils techniques
 * (console, Grafana…) ont leur propre page de connexion sur identity.
 */
export function OnboardingPage() {
  const [params] = useSearchParams()
  const status = useSessionStore(selectStatus)
  const endReason = useSessionStore(selectEndReason)
  const suspendedUntil = useSessionStore((state) => state.suspendedUntil)
  const suspensionReason = useSessionStore((state) => state.suspensionReason)
  const step = useOnboardingStore((state) => state.step)
  const go = useOnboardingStore((state) => state.go)
  const social = params.get('social') === 'success'

  useEffect(() => {
    if (social) void loginRedirect()
  }, [social])

  if (status === 'loading' || social) return <LoadingScreen />

  if (status !== 'authenticated') {
    if (endReason) {
      return (
        <SessionEnded
          reason={endReason}
          suspendedUntil={suspendedUntil}
          suspensionReason={suspensionReason}
          onLogin={() => {
            dismissEndReason()
            go('login')
          }}
        />
      )
    }
    return step === 'code' ? <CodeStep /> : <LoginStep />
  }
  return <MemberOnboarding />
}

/** Avec une session : le compte (lu seulement ici) décide de la reprise, des étapes de compte et de la sortie. */
function MemberOnboarding() {
  const navigate = useNavigate()
  const me = useMe()
  const step = useOnboardingStore((state) => state.step)
  const go = useOnboardingStore((state) => state.go)
  const setUniverses = useOnboardingStore((state) => state.setUniverses)
  const onboarded = me.data?.onboardingCompleted ?? false
  const interests = me.data?.interests

  // Arrivée connectée sur un parcours inachevé : reprise à Univers, avec les choix déjà enregistrés.
  const resumed = useRef(false)
  useEffect(() => {
    if (resumed.current || !interests || onboarded) return
    resumed.current = true
    setUniverses(interests.map(toCategoryCode))
    go('universes')
  }, [interests, onboarded, setUniverses, go])

  // Parcours terminé ou joueur déjà inscrit : la page demandée avant la connexion, sinon l'Accueil.
  const left = useRef(false)
  useEffect(() => {
    if (!onboarded || left.current) return
    left.current = true
    void navigate(returnTo.consume(), { replace: true })
  }, [onboarded, navigate])

  if (me.isError && !me.data) return <BootError onRetry={() => void me.refetch()} retrying={me.isFetching} />
  if (!me.data || onboarded) return <LoadingScreen />
  // Étape de compte, avant la personnalisation : une fois, pour les comptes récents (`onboarding.md`).
  if (me.data.birthDateRequired) return <BirthDateStep />
  if (me.data.termsUpToDate === false) return <TermsStep />

  switch (step) {
    case 'notifications':
      return <NotificationsStep />
    case 'first':
      return <FirstTopicStep />
    default:
      return <UniversesStep />
  }
}
