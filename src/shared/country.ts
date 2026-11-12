/**
 * Libellé d'un pays (code ISO 3166 alpha-2) dans la langue de l'interface, par `Intl.DisplayNames` ; le code brut si
 * le navigateur ne sait pas le nommer.
 */
export function countryLabel(code: string, language: string): string {
  const normalized = code.trim().toUpperCase()
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(normalized) ?? normalized
  } catch {
    return normalized
  }
}

/** Pays proposés dans Réglages › Pays (liste du lab, `design/src/lab/fixtures/profile.ts`), comme le mobile. */
export const COUNTRY_CODES = ['DZ', 'DE', 'BE', 'BJ', 'BF', 'CM', 'CA', 'KM', 'CI', 'ES', 'US', 'FR', 'GA', 'GN', 'HT', 'IT', 'LB', 'LU', 'MG', 'ML', 'MA', 'MR', 'MC', 'NE', 'PT', 'GB', 'SN', 'CH', 'TG', 'TN'] as const

/** Drapeau emoji d'un code ISO 3166 alpha-2. */
export const countryFlag = (code: string) => String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 0x1f1a5 + letter.charCodeAt(0)))
