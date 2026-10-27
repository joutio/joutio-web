import { config } from "@/lib/config"

const CONTINUE_KEY = "joutio.continue"

/**
 * Cible externe transmise par identity (`?continue=`) quand un client tiers (Grafana,
 * ArgoCD, mobile…) déclenche une autorisation sans session SPA. Sans reprise, le login
 * s'achèverait sur l'accueil de la SPA au lieu de rejoindre le client d'origine.
 */
export function isAuthorizationContinueUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.origin === config.oidcAuthority &&
      parsed.pathname === "/oauth2/authorize"
    )
  } catch {
    return false
  }
}

export function rememberContinue(url: string | null): void {
  if (!url || !isAuthorizationContinueUrl(url)) return
  try {
    sessionStorage.setItem(CONTINUE_KEY, url)
  } catch {
    // Stockage indisponible (navigation privée) : flux SPA standard.
  }
}

export function readContinue(): string | null {
  try {
    return sessionStorage.getItem(CONTINUE_KEY)
  } catch {
    return null
  }
}

export function clearContinue(): void {
  try {
    sessionStorage.removeItem(CONTINUE_KEY)
  } catch {
    // Rien à faire : le stockage est indisponible.
  }
}

/**
 * Reprend la cible externe si elle est mémorisée, sinon ne fait rien (l'appelant
 * poursuit le flux SPA standard). La cible est consommée une seule fois.
 */
export function resumeContinue(): boolean {
  const target = readContinue()
  if (!target || !isAuthorizationContinueUrl(target)) return false
  clearContinue()
  window.location.assign(target)
  return true
}
