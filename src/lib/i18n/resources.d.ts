import "i18next"
import type { Resources } from "./locales/fr"

/**
 * Typage des clés de traduction : `t("common.app.loading")` est vérifié et autocomplété,
 * une clé inconnue casse la compilation.
 */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation"
    resources: {
      translation: Resources
    }
  }
}
