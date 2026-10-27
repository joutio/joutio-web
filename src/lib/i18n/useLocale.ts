import { useTranslation } from "react-i18next"

/**
 * Locale BCP 47 pour `Intl` (dates, nombres) alignée sur la langue d'interface.
 * Remplacer les locales codées en dur (`fr-FR`) par ce hook.
 */
export function useLocale(): string {
  const { i18n } = useTranslation()
  return (i18n.resolvedLanguage ?? "fr").startsWith("en") ? "en-US" : "fr-FR"
}
