import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLanguageStore } from '@/lib/i18n'
import { meQuery } from '@joutio/client/query'
import { selectStatus, useSessionStore } from '@/lib/session'
import { api } from '@/lib/api'

/** Joueur courant (`GET /api/me`), seulement avec une session. Sa langue devient celle de l'app. */
export function useMe() {
  const authenticated = useSessionStore(selectStatus) === 'authenticated'
  const me = useQuery({ ...meQuery(api), enabled: authenticated })
  const language = me.data?.language
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  useEffect(() => {
    if (language) setLanguage(language)
  }, [language, setLanguage])
  return me
}
