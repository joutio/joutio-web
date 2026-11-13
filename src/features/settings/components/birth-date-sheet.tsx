import { birthDateIssue, BIRTH_DATE_PROBLEMS, isoDay, MIN_AGE } from '@joutio/client-domain/profile'
import { useState } from 'react'
import { useSetBirthDate } from '@/features/me'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { toast } from '@/shared/toast'
import { Button, Field, MobileSheet } from '@/ui'

/**
 * Date de naissance (`editer-profil.md` § 5), modifiable dans Réglages › Compte seulement : champ `date` (sélecteur du
 * navigateur), 15 ans minimum, privée. Valider enregistre aussitôt.
 */
export function BirthDateSheet({ open, value, onClose }: { open: boolean; value: string | null | undefined; onClose: () => void }) {
  const t = useT()
  const save = useSetBirthDate()
  // Brouillon `null` : la valeur enregistrée ; remis à zéro à la fermeture.
  const [edited, setEdited] = useState<string | null>(null)
  const draft = edited ?? value ?? ''
  const setDraft = setEdited
  const dismiss = () => {
    setEdited(null)
    onClose()
  }
  const today = isoDay(new Date())
  const issue = draft === '' ? null : birthDateIssue(draft, today)

  const submit = () =>
    save.mutate(draft, {
      onSuccess: () => {
        toast.success(t('account.birthDateSaved'))
        dismiss()
      },
      onError: (error) =>
        toast.error(t(isApiError(error) && error.type === BIRTH_DATE_PROBLEMS.underage ? 'account.underage' : 'settings.saveError', { age: MIN_AGE })),
    })

  return (
    <MobileSheet
      open={open}
      onClose={dismiss}
      title={t('account.birthDate')}
      footer={
        <Button full disabled={draft === '' || issue !== null || draft === value} loading={save.isPending} onClick={submit}>
          {t('account.validate')}
        </Button>
      }
    >
      <Field
        type="date"
        label={t('account.birthDate')}
        value={draft}
        max={today}
        error={issue ? t(issue === 'underage' ? 'account.underage' : 'account.birthDateInvalid', { age: MIN_AGE }) : undefined}
        hint={issue ? undefined : t('account.birthDatePrivate')}
        onChange={(event) => setDraft(event.target.value)}
      />
    </MobileSheet>
  )
}
