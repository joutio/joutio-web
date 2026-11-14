import { BIRTH_DATE_PROBLEMS, birthDateIssue, isoDay, MIN_AGE } from '@joutio/client-domain/profile'
import { CakeIcon, ProhibitIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useSetBirthDate } from '@/features/me'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { Button, Field, Notice, Screen } from '@/ui'

/**
 * Date de naissance (`onboarding.md`, 2026-11-13) : demandée une fois après la connexion à tout compte récent
 * (`MeView.birthDateRequired`), même arrivé par un lien de salon. Une date sous 15 ans affiche la carte « réservé aux 15 ans et plus » sous le champ et
 * garde « Continuer » désactivé (plus d'écran de blocage).
 */
export function BirthDateStep() {
  const t = useT()
  const save = useSetBirthDate()
  const [birthDate, setBirthDate] = useState('')
  // Refus du serveur (`PUT /api/me/birth-date` sous 15 ans) : même carte que la saisie locale.
  const [refused, setRefused] = useState(false)
  const today = isoDay(new Date())
  const issue = birthDate === '' ? null : birthDateIssue(birthDate, today)
  const tooYoung = issue === 'underage' || refused

  const submit = () => {
    if (tooYoung) return
    save.mutate(birthDate, {
      onError: (error) => {
        if (isApiError(error) && error.type === BIRTH_DATE_PROBLEMS.underage) setRefused(true)
        else toast.error(t('settings.saveError'), t('home.errorText'))
      },
    })
  }

  return (
    <Screen
      bottomNav={
        <div className="flex-none bg-jo-bg px-4 pt-2 pb-[calc(var(--jo-safe-bottom,0px)+16px)]">
          <Button full disabled={birthDate === '' || tooYoung || issue !== null} loading={save.isPending} onClick={submit}>
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
          onChange={(event) => {
            setBirthDate(event.target.value)
            setRefused(false)
          }}
        />
        {tooYoung && <Notice tone="error" icon={ProhibitIcon} title={t('tooYoung.title')} message={t('tooYoung.message')} />}
      </div>
    </Screen>
  )
}
