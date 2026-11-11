import { z } from 'zod'
import { useT } from '@/lib/i18n'
import { startSocialLogin } from '@/lib/session'
import { Button, Field, Logo, Notice, Screen, SocialButton } from '@/ui'
import { useRequestLoginCode } from '../hooks/use-onboarding'
import { useOnboardingStore } from '../onboarding-store'

const emailSchema = z.email()

/** Connexion : Google, Facebook, ou code reçu par e-mail. Pas de mot de passe. */
export function LoginStep() {
  const t = useT()
  const email = useOnboardingStore((state) => state.email)
  const setEmail = useOnboardingStore((state) => state.setEmail)
  const go = useOnboardingStore((state) => state.go)
  const request = useRequestLoginCode()
  const valid = emailSchema.safeParse(email.trim()).success

  const submit = () => {
    if (!valid || request.isPending) return
    const address = email.trim()
    setEmail(address)
    request.mutate(address, { onSuccess: () => go('code') })
  }

  return (
    <Screen>
      <div className="flex min-h-full flex-col gap-6 px-6 pt-8 pb-6">
        <Logo variant="lockup" size={32} className="self-start" />
        <div className="grid flex-1 content-center gap-2">
          <h1 className="jo-type-large-title m-0 text-balance">{t('onboarding.login.title')}</h1>
          <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('onboarding.login.subtitle')}</p>
        </div>
        <form
          className="grid gap-2"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <SocialButton provider="google" onClick={() => startSocialLogin('google')} />
          <SocialButton provider="facebook" onClick={() => startSocialLogin('facebook')} />
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 py-2">
            <span className="h-px bg-jo-border" />
            <span className="jo-type-caption text-jo-muted">{t('onboarding.login.or')}</span>
            <span className="h-px bg-jo-border" />
          </div>
          <Field
            aria-label={t('onboarding.login.email')}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('onboarding.login.emailPlaceholder')}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              if (request.isError) request.reset()
            }}
          />
          {request.isError && <Notice tone="error" title={t('onboarding.login.sendError')} message={t('common.checkConnection')} />}
          <Button type="submit" full disabled={!valid} loading={request.isPending}>
            {t('onboarding.login.sendCode')}
          </Button>
        </form>
        <p className="jo-type-caption m-0 text-center text-pretty text-jo-muted">
          {t('onboarding.login.legalBefore')}
          <a href="/terms.html" target="_blank" rel="noreferrer" className="jo-focus rounded-jo-xs underline">
            {t('onboarding.login.terms')}
          </a>
          {t('onboarding.login.legalBetween')}
          <a href="/privacy.html" target="_blank" rel="noreferrer" className="jo-focus rounded-jo-xs underline">
            {t('onboarding.login.privacy')}
          </a>
          .
        </p>
      </div>
    </Screen>
  )
}
