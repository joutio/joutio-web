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
