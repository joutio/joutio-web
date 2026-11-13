import type { ChallengeView, MeView, NotificationCategory, NotificationPreferenceView, PageResponse, PlayerCardView, PlayerProfileView } from '@joutio/client-domain/api-types'
import { PSEUDONYM_PROBLEMS, pseudonymIssue, pseudonymKey, type PseudonymIssue } from '@joutio/client-domain/profile'
import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useMe } from '@/features/me'
import { isApiError } from '@/lib/api'
import { useLanguageStore, useT } from '@/lib/i18n'
import { optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/shared/toast'
import { settingsService } from '../lib/settings-service'

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
  const query = useQuery({
    queryKey: queryKeys.pseudonymAvailability(pseudonymKey(debounced)),
    queryFn: () => settingsService.pseudonymAvailability(debounced),
    enabled: !unchanged && issue === null && settled,
    staleTime: 10_000,
  })
  if (unchanged) return { state: 'unchanged' }
  if (issue) return { state: 'invalid', issue }
  if (!settled || query.isPending || query.isFetching) return { state: 'checking' }
  if (query.data && !query.data.valid) return { state: 'invalid', issue: 'characters' }
  // Vérification indisponible : on laisse le serveur trancher à l'enregistrement.
  return query.data?.available === false ? { state: 'taken' } : { state: 'available' }
}

export type MeField = 'pseudonym' | 'bio' | 'country' | 'bannerUrl' | 'language' | 'avatarOptions' | 'interests'

const SAVERS: { [K in MeField]: (userId: string, value: MeView[K]) => Promise<void> } = {
  pseudonym: (userId, value) => settingsService.pseudonym(userId, value),
  bio: (userId, value) => settingsService.bio(userId, value),
  country: (userId, value) => settingsService.country(userId, value),
  bannerUrl: (userId, value) => settingsService.banner(userId, value),
  language: (userId, value) => settingsService.language(userId, value),
  avatarOptions: (userId, value) => settingsService.avatarOptions(userId, value),
  interests: (_userId, value) => settingsService.interests(value),
}

/**
 * Modifie un champ du profil, **optimiste** : `me` change sur place (Profil, Réglages, cloche), ainsi que ma fiche
 * publique, mes lignes dans les listes Social et mes défis ; tout est restauré si le BFF refuse.
 */
export function useUpdateMe<K extends MeField>(field: K) {
  const client = useQueryClient()
  const t = useT()
  const userId = useMe().data?.userId ?? ''
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  return useMutation({
    mutationFn: (value: MeView[K]) => SAVERS[field](userId, value),
    onMutate: (value: MeView[K]) =>
      optimisticUpdate(client, [queryKeys.me, queryKeys.profiles.profile(userId), queryKeys.contacts.all, queryKeys.challenges], () => {
        const mine = <T extends { userId: string }>(user: T): T => (user.userId === userId ? { ...user, [field]: value } : user)
        const previousLanguage = client.getQueryData<MeView>(queryKeys.me)?.language
        client.setQueryData<MeView>(queryKeys.me, (me) => (me ? { ...me, [field]: value } : me))
        if (field === 'language' && previousLanguage !== value) setLanguage(value as MeView['language'])
        if (field !== 'interests') client.setQueryData<PlayerProfileView>(queryKeys.profiles.profile(userId), (profile) => (profile ? { ...profile, [field]: value } : profile))
        if (field !== 'pseudonym' && field !== 'avatarOptions') return
        client.setQueriesData<InfiniteData<PageResponse<PlayerCardView>>>({ queryKey: queryKeys.contacts.all }, (data) =>
          data ? { ...data, pages: data.pages.map((page) => ({ ...page, content: page.content.map(mine) })) } : data,
        )
        client.setQueryData<ChallengeView[]>(queryKeys.challenges, (items) => items?.map((challenge) => ({ ...challenge, challenger: mine(challenge.challenger), opponent: mine(challenge.opponent) })))
      }),
    onError: (error, _value, context) => {
      context?.rollback()
      if (field === 'language') {
        const language = client.getQueryData<MeView>(queryKeys.me)?.language
        if (language) setLanguage(language)
      }
      if (field === 'pseudonym' && isApiError(error) && error.type === PSEUDONYM_PROBLEMS.taken) {
        toast.error(t('settings.pseudonymTaken'))
        return
      }
      if (field === 'pseudonym' && isApiError(error) && error.type === PSEUDONYM_PROBLEMS.invalid) {
        toast.error(t('settings.pseudonymRules'))
        return
      }
      toast.error(t('settings.saveError'), t('home.errorText'))
    },
  })
}

const PREFERENCES_KEY = ['notification-preferences'] as const

/** Préférences de notification persistées (`FOLLOW|ROOM|QUESTION`). */
export function useNotificationPreferences() {
  return useQuery({ queryKey: PREFERENCES_KEY, queryFn: settingsService.preferences, staleTime: 60_000 })
}

export function useSetNotificationPreference() {
  const client = useQueryClient()
  const t = useT()
  return useMutation({
    mutationFn: ({ category, enabled }: { category: NotificationCategory; enabled: boolean }) => settingsService.setPreference(category, enabled),
    onMutate: ({ category, enabled }) =>
      optimisticUpdate(client, [PREFERENCES_KEY], () =>
        client.setQueryData<NotificationPreferenceView[]>(PREFERENCES_KEY, (items) => [...(items ?? []).filter((item) => item.category !== category), { category, enabled }]),
      ),
    onError: (_error, _value, context) => {
      context?.rollback()
      toast.error(t('settings.preferenceError'))
    },
  })
}

/** Code de suppression envoyé par e-mail. */
export const useRequestDeletionCode = () => useMutation({ mutationFn: settingsService.requestDeletionCode })

/** Suppression définitive du compte (code à 6 chiffres). */
export const useDeleteAccount = () => useMutation({ mutationFn: (code: string) => settingsService.deleteAccount(code) })

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
