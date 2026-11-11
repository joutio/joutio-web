import { useState } from 'react'
import { ArrowCounterClockwiseIcon, BellRingingIcon, LightningIcon, MedalIcon } from '@phosphor-icons/react'
import { useT } from '@/lib/i18n'
import { enablePush } from '@/lib/push'
import { trackEvent } from '@/lib/telemetry'
import { Button, ListRow, Notice } from '@/ui'
import { useCompleteOnboarding } from '../hooks/use-onboarding'
import { useOnboardingStore } from '../onboarding-store'
import { Steps } from './steps'

/** Notifications : « Activer » ouvre la demande du navigateur (Web Push), « Plus tard » passe à la suite. */
export function NotificationsStep() {
  const t = useT()
  const skipped = useOnboardingStore((state) => state.skipped)
  const go = useOnboardingStore((state) => state.go)
  const complete = useCompleteOnboarding()
  const [asking, setAsking] = useState(false)

  // Après « Passer » : pas de premier thème, l'onboarding se termine ici.
  const next = () => {
    if (skipped) complete.mutate(undefined, { onSuccess: () => trackEvent('onboarding_skipped') })
    else go('first')
  }

  const enable = async () => {
    setAsking(true)
    try {
      await enablePush()
    } catch {
      // Refus ou service indisponible : le réglage reste modifiable plus tard.
    } finally {
      setAsking(false)
      next()
    }
  }

  return (
    <Steps
      index={1}
      footer={
        <div className="grid gap-2">
          {complete.isError && <Notice tone="error" title={t('onboarding.first.completeError')} message={t('common.checkConnection')} />}
          <span className="jo-type-caption text-center text-jo-muted">{t('onboarding.notifications.hint')}</span>
          <Button full loading={asking || complete.isPending} onClick={() => void enable()}>
            {t('onboarding.notifications.enable')}
          </Button>
          <Button full variant="plain" tone="neutral" disabled={asking || complete.isPending} onClick={next}>
            {t('onboarding.notifications.later')}
          </Button>
        </div>
      }
    >
      <div className="grid justify-items-center gap-3 pt-6 text-center">
        <span className="grid size-16 -rotate-6 place-items-center rounded-jo-lg bg-jo-accent text-jo-on-accent">
          <BellRingingIcon size={32} weight="fill" aria-hidden />
        </span>
        <h1 className="jo-type-title-1 m-0">{t('onboarding.notifications.title')}</h1>
        <p className="jo-type-body m-0 max-w-[320px] text-pretty text-jo-muted">{t('onboarding.notifications.subtitle')}</p>
      </div>
      <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
        <ListRow icon={LightningIcon} label={t('onboarding.notifications.challenge')} control="none" />
        <ListRow icon={ArrowCounterClockwiseIcon} label={t('onboarding.notifications.rematch')} control="none" />
        <ListRow icon={MedalIcon} label={t('onboarding.notifications.rank')} control="none" last />
      </div>
    </Steps>
  )
}
