import { usePseudonymAvailability } from '@joutio/client/me'
import { PSEUDONYM_PROBLEMS, pseudonymIssue, type PseudonymIssue } from '@joutio/client/profile'
import { useEffect, useState } from 'react'
import { isApiError } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { toast } from '@/shared/toast'

/** État de saisie du pseudonyme : règles locales immédiates, unicité vérifiée par le BFF après une courte pause. */
export type PseudonymCheck =
  | { state: 'unchanged' | 'checking' | 'available' | 'taken' }
  | { state: 'invalid'; issue: PseudonymIssue }

const PSEUDONYM_CHECK_DELAY_MS = 350

export function usePseudonymCheck(value: string, current: string | undefined): PseudonymCheck {
  const trimmed = value.trim()
  const unchanged = trimmed === (current ?? '')
  const issue = unchanged ? null : pseudonymIssue(trimmed)
  const [debounced, setDebounced] = useState(trimmed)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(trimmed), PSEUDONYM_CHECK_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [trimmed])
  const settled = debounced === trimmed
  // Saisie vide : `usePseudonymAvailability` ne lit rien.
  const query = usePseudonymAvailability(!unchanged && issue === null && settled ? debounced : '')
  if (unchanged) return { state: 'unchanged' }
  if (issue) return { state: 'invalid', issue }
  if (!settled || query.isPending || query.isFetching) return { state: 'checking' }
  if (query.data && !query.data.valid) return { state: 'invalid', issue: 'characters' }
  // Vérification indisponible : on laisse le serveur trancher à l'enregistrement.
  return query.data?.available === false ? { state: 'taken' } : { state: 'available' }
}

/** Refus d'un champ du profil : pseudonyme pris ou hors règles, sinon l'erreur générique. */
export function useProfileSaveError() {
  const t = useT()
  return (error: unknown) => {
    if (isApiError(error) && error.type === PSEUDONYM_PROBLEMS.taken) return toast.error(t('settings.pseudonymTaken'))
    if (isApiError(error) && error.type === PSEUDONYM_PROBLEMS.invalid) return toast.error(t('settings.pseudonymRules'))
    toast.error(t('settings.saveError'), t('home.errorText'))
  }
}

type Translate = ReturnType<typeof useT>

const ISSUE_KEYS = {
  tooShort: 'settings.pseudonymTooShort',
  tooLong: 'settings.pseudonymTooLong',
  firstLetter: 'settings.pseudonymFirstLetter',
  characters: 'settings.pseudonymCharacters',
} as const

export function pseudonymError(check: PseudonymCheck, t: Translate): string | undefined {
  if (check.state === 'invalid') return t(ISSUE_KEYS[check.issue])
  if (check.state === 'taken') return t('settings.pseudonymTaken')
  return undefined
}

export function pseudonymHint(check: PseudonymCheck, t: Translate): string {
  if (check.state === 'checking') return t('settings.pseudonymChecking')
  if (check.state === 'available') return t('settings.pseudonymAvailable')
  return t('settings.pseudonymRules')
}
