import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { continueUrl, loginRedirect, selectStatus, useSessionStore } from '@/lib/session'
import { useT } from '@/lib/i18n'
import { EmptyState, Logo, Screen } from '@/ui'
import { SignInIcon } from '@phosphor-icons/react'

/**
 * Entrée anonyme (`/welcome`). L'écran Onboarding (connexion par code, Google, Facebook) arrive en premier à l'étape 4 ;
 * la plomberie de retour est déjà là : `?continue=` (autorisation d'un client tiers) et `?social=success` (retour de
 * connexion sociale, on enchaîne le PKCE).
 */
export function WelcomePage() {
  const t = useT()
  const [params] = useSearchParams()
  const status = useSessionStore(selectStatus)
  const social = params.get('social') === 'success'

  useEffect(() => {
    if (params.has('continue')) continueUrl.accept(params.get('continue'))
    if (social && !continueUrl.resume()) void loginRedirect()
  }, [params, social])

  if (status === 'authenticated' && !social) return <Navigate to="/" replace />

  return (
    <Screen>
      <div className="grid h-full content-center justify-items-center gap-6 px-6">
        <Logo variant="lockup" size={44} />
        <EmptyState icon={SignInIcon} title={t('common.comingSoon')} />
      </div>
    </Screen>
  )
}
