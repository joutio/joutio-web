import { ClockIcon, ProhibitIcon } from '@phosphor-icons/react'
import { useT } from '@/lib/i18n'
import type { SessionEndReason } from '@/lib/session'
import { Button, Notice, Screen } from '@/ui'

const SUPPORT = 'mailto:contact@joutio.com'

/** Session coupée : plein écran, sans navigation. Le motif et l'échéance d'une suspension restent dans l'e-mail. */
export function SessionEnded({ reason, onLogin }: { reason: SessionEndReason; onLogin: () => void }) {
  const t = useT()
  return (
    <Screen>
      <div className="flex min-h-full flex-col justify-center gap-4 px-4 pt-8 pb-6">
        {reason === 'suspended' ? (
          <>
            <Notice tone="error" icon={ProhibitIcon} title={t('onboarding.ended.suspendedTitle')} message={t('onboarding.ended.suspendedMessage')} />
            <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('onboarding.ended.suspendedBody')}</p>
            <div className="grid gap-2">
              <Button full variant="gray" tone="neutral" onClick={() => window.location.assign(SUPPORT)}>
                {t('onboarding.ended.support')}
              </Button>
              <Button full variant="plain" tone="neutral" onClick={onLogin}>
                {t('onboarding.ended.logout')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Notice tone="info" icon={ClockIcon} title={t('onboarding.ended.expiredTitle')} message={t('onboarding.ended.expiredMessage')} />
            <Button full onClick={onLogin}>
              {t('onboarding.ended.relogin')}
            </Button>
          </>
        )}
      </div>
    </Screen>
  )
}
