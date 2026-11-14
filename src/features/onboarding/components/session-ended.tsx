import { ClockIcon, ProhibitIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import type { SessionEndReason } from '@/lib/session'
import { Button, Notice, Screen } from '@/ui'

const SUPPORT = 'mailto:contact@joutio.com'

/** Motifs de suspension connus (`UserSuspensionReason` d'identity), libellés dans `onboarding.ended.reason.*`. */
const SUSPENSION_REASONS = ['HARASSMENT', 'HATE_SPEECH', 'THREATS', 'IMPERSONATION', 'PRIVACY_VIOLATION', 'INAPPROPRIATE_CONTENT', 'SPAM', 'COPYRIGHT', 'CHEATING', 'EXPLOIT_ABUSE', 'MULTIPLE_ACCOUNTS', 'TERMS_VIOLATION', 'MINOR_SAFETY', 'FRAUD', 'OTHER']

/** « dans 7 jours », « dans 5 heures » : le plus grand pas entier, jamais zéro. */
function remainingLabel(until: Date, now: number, language: string): string {
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: 'auto' })
  const minutes = Math.max(1, Math.round((until.getTime() - now) / 60_000))
  if (minutes < 60) return formatter.format(minutes, 'minute')
  if (minutes < 24 * 60) return formatter.format(Math.round(minutes / 60), 'hour')
  return formatter.format(Math.round(minutes / (24 * 60)), 'day')
}

/**
 * Session coupée : plein écran, sans navigation. Une suspension annonce sa fin (`suspendedUntil` du `403`, absent :
 * définitive) ; le motif reste dans l'e-mail.
 */
export function SessionEnded({ reason, suspendedUntil, suspensionReason, onLogin }: { reason: SessionEndReason; suspendedUntil?: string | null; suspensionReason?: string | null; onLogin: () => void }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const [now] = useState(() => Date.now())
  const until = suspendedUntil ? new Date(suspendedUntil) : null
  const validUntil = until && !Number.isNaN(until.getTime()) && until.getTime() > now ? until : null
  const suspendedMessage = validUntil
    ? t('onboarding.ended.suspendedUntil', {
        date: validUntil.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' }),
        remaining: remainingLabel(validUntil, now, language),
      })
    : t('onboarding.ended.suspendedMessage')
  const reasonLabel = suspensionReason && SUSPENSION_REASONS.includes(suspensionReason) ? t(`onboarding.ended.reason.${suspensionReason}` as MessageKey) : null
  return (
    <Screen>
      <div className="flex min-h-full flex-col justify-center gap-4 px-4 pt-8 pb-6">
        {reason === 'suspended' ? (
          <>
            <Notice tone="error" icon={ProhibitIcon} title={t('onboarding.ended.suspendedTitle')} message={reasonLabel ? `${suspendedMessage} ${t('onboarding.ended.reasonLine', { reason: reasonLabel })}` : suspendedMessage} />
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
