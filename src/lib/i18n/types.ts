import type { Resources } from "./locales/fr"

/** Chemins de clés pointés du catalogue (`shell.nav.home`). */
type DottedKeys<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${DottedKeys<T[K]>}`
}[keyof T & string]

/**
 * Union des clés de traduction valides — utile pour typer des données qui portent une clé
 * (entrées de navigation, options de select…).
 */
export type TranslationKey = DottedKeys<Resources>
