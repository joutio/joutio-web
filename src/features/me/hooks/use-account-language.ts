import { useMyLanguage } from '@joutio/client/me'
import { useEffect } from 'react'
import { useLanguageStore } from '@/lib/i18n'

/** La langue du compte (`MeView.language`) devient celle de l'app. À monter une fois, sous session. */
export function useAccountLanguage() {
  const language = useMyLanguage().data
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  useEffect(() => {
    if (language) setLanguage(language)
  }, [language, setLanguage])
}
