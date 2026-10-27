import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useMe } from "../hooks/useMe"

/**
 * Aligne la langue d'interface sur celle du **profil** (`me.language`, source de vérité)
 * dès qu'elle est chargée. Le choix reste mémorisé par le détecteur i18next (localStorage)
 * pour les écrans pré-connexion (login, OTP, callback).
 */
export function LanguageSync() {
  const { data: me } = useMe()
  const { i18n } = useTranslation()

  useEffect(() => {
    const language = me?.language
    if (language && i18n.resolvedLanguage !== language) {
      void i18n.changeLanguage(language)
    }
  }, [me?.language, i18n])

  return null
}
