import { BIRTH_DATE_PROBLEMS, birthDateIssue, isoDay, MIN_AGE } from '@joutio/client-domain/profile'
import { normalizeReferralCode } from '@joutio/client-domain/share'
import { CakeIcon, GiftIcon, ProhibitIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useApplyReferral, useSetBirthDate } from '@/features/me'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { logout } from '@/lib/session'
import { pendingReferral } from '@/shared/pending-referral'
import { toast } from '@/shared/toast'
import { Button, Field, Notice, Screen } from '@/ui'

const SUPPORT = 'mailto:contact@joutio.com'

/**
 * Date de naissance (`onboarding.md`, 2026-11-13) : demandée une fois après la connexion à tout compte récent
 * (`MeView.birthDateRequired`), même arrivé par un lien de salon. Code de parrainage pré-rempli depuis le lien
 * d'invitation, ou saisi. Moins de 15 ans : écran de blocage.
 */
export function BirthDateStep() {
  const t = useT()
  const save = useSetBirthDate()
  const applyReferral = useApplyReferral()
  const pending = pendingReferral.peek()
  const [birthDate, setBirthDate] = useState('')
  const [code, setCode] = useState(pending ?? '')
  const [codeOpen, setCodeOpen] = useState(pending !== null)
  const [tooYoung, setTooYoung] = useState(false)
  const today = isoDay(new Date())
  const issue = birthDate === '' ? null : birthDateIssue(birthDate, today)

  const submit = () => {
    if (issue === 'underage') {
      setTooYoung(true)
      return
    }
    save.mutate(birthDate, {
      onSuccess: () => {
        const referral = normalizeReferralCode(code)
        pendingReferral.clear()
        if (referral) applyReferral.mutate(referral, { onError: () => toast.error(t('birth.referralError')) })
      },
      onError: (error) => {
        if (isApiError(error) && error.type === BIRTH_DATE_PROBLEMS.underage) setTooYoung(true)
        else toast.error(t('settings.saveError'), t('home.errorText'))
      },
    })
  }

  if (tooYoung) {
    return (
      <Screen>
        <div className="flex min-h-full flex-col justify-center gap-4 px-4 pt-8 pb-6">
          <Notice tone="error" icon={ProhibitIcon} title={t('tooYoung.title')} message={t('tooYoung.message')} />
          <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('tooYoung.text')}</p>
          <div className="grid gap-2">
            <Button full variant="gray" tone="neutral" onClick={() => window.location.assign(SUPPORT)}>
              {t('tooYoung.support')}
            </Button>
            <Button full variant="plain" tone="neutral" onClick={() => void logout()}>
              {t('settings.logout')}
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      bottomNav={
        <div className="flex-none bg-jo-bg px-4 pt-2 pb-[calc(var(--jo-safe-bottom,0px)+16px)]">
          <Button full disabled={birthDate === '' || (issue !== null && issue !== 'underage')} loading={save.isPending} onClick={submit}>
            {t('birth.continue')}
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 px-4 pt-8 pb-4">
        <div className="grid gap-2">
          <span className="grid size-14 -rotate-6 place-items-center rounded-jo-lg bg-jo-accent text-jo-on-accent">
            <CakeIcon size={28} weight="fill" aria-hidden />
          </span>
          <h1 className="jo-type-title-1 m-0 text-balance">{t('birth.title')}</h1>
          <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('birth.text')}</p>
        </div>
        <Field
          type="date"
          label={t('account.birthDate')}
          value={birthDate}
          max={today}
          error={issue && issue !== 'underage' ? t('account.birthDateInvalid', { age: MIN_AGE }) : undefined}
          onChange={(event) => setBirthDate(event.target.value)}
        />
        {codeOpen ? (
          <div className="grid gap-2 rounded-jo-lg bg-jo-surface p-4">
            {pending && (
              <span className="jo-type-headline flex items-center gap-2">
                <GiftIcon size={20} weight="fill" className="text-jo-accent-ink" aria-hidden />
                {t('birth.invitedBy')}
              </span>
            )}
            <Field
              label={t('birth.referralCode')}
              value={code}
              maxLength={8}
              hint={t('birth.referralHint')}
              autoCapitalize="characters"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              onClear={() => setCode('')}
            />
          </div>
        ) : (
          <Button variant="plain" onClick={() => setCodeOpen(true)}>
            {t('birth.haveCode')}
          </Button>
        )}
      </div>
    </Screen>
  )
}
