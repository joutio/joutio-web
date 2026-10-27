import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"
import { en } from "./locales/en"
import { fr } from "./locales/fr"

/** Clé localStorage de la langue d'interface (persistance pré-connexion incluse). */
export const LANGUAGE_STORAGE_KEY = "joutio-language"

/** Reflète la langue d'interface sur `<html lang>` (accessibilité, typographie). */
function applyDocumentLanguage(language: string): void {
  if (typeof document === "undefined") return
  document.documentElement.lang = language.startsWith("en") ? "en" : "fr"
}

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        fr: { translation: fr },
        en: { translation: en },
      },
      fallbackLng: "fr",
      supportedLngs: ["fr", "en"],
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      detection: {
        // Dernière langue choisie, sinon langue du navigateur (repli fr) — le profil
        // serveur (`me.language`) prend le relais dès son chargement (LanguageSync).
        order: ["localStorage", "navigator"],
        lookupLocalStorage: LANGUAGE_STORAGE_KEY,
        caches: ["localStorage"],
      },
      react: { useSuspense: false },
    })
}

applyDocumentLanguage(i18n.resolvedLanguage ?? "fr")
i18n.on("languageChanged", applyDocumentLanguage)

export default i18n
