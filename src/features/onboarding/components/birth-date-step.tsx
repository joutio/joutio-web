import { zodResolver } from '@hookform/resolvers/zod'
import { birthDateSchema } from '@joutio/client/forms'
import { BIRTH_DATE_PROBLEMS, isoDay, MIN_AGE } from '@joutio/client/profile'
import { CakeIcon, ProhibitIcon } from '@phosphor-icons/react'
import { Controller, useForm } from 'react-hook-form'
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
  const today = isoDay(new Date())
  const form = useForm({ resolver: zodResolver(birthDateSchema(today)), mode: 'onChange', defaultValues: { birthDate: '' } })
  const error = form.formState.errors.birthDate?.message
  // Moins de 15 ans, saisi ou refusé par le serveur (`PUT /api/me/birth-date`) : la carte remplace le message du champ.
  const tooYoung = error === 'tooYoung.title'

  const submit = form.handleSubmit(({ birthDate }) =>
    save.mutate(birthDate, {
      onError: (cause) => {
        if (isApiError(cause) && cause.type === BIRTH_DATE_PROBLEMS.underage) form.setError('birthDate', { message: 'tooYoung.title' })
        else toast.error(t('settings.saveError'), t('home.errorText'))
      },
    }),
  )

  return (
    <Screen
      footer={
        <div className="flex-none bg-jo-bg px-4 pt-2 pb-[calc(var(--jo-safe-bottom,0px)+16px)]">
          <Button full disabled={!form.formState.isValid} loading={save.isPending} onClick={() => void submit()}>
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
        <Controller
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <Field
              type="date"
              label={t('account.birthDate')}
              value={field.value}
              max={today}
              error={error && !tooYoung ? t('account.birthDateInvalid', { age: MIN_AGE }) : undefined}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
        {tooYoung && <Notice tone="error" icon={ProhibitIcon} title={t('tooYoung.title')} message={t('tooYoung.message')} />}
      </div>
    </Screen>
  )
}
