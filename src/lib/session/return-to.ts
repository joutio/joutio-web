import { config } from '../config'
import { transient } from './token-storage'

const RETURN_KEY = 'joutio.returnTo'
const CONTINUE_KEY = 'joutio.continue'

/** Cible interne à rouvrir après la connexion (lien profond, lien de salon). Chemins internes seulement. */
export const returnTo = {
  remember(path: string | null) {
    transient.write(RETURN_KEY, path && path.startsWith('/') && !path.startsWith('//') ? path : null)
  },
  consume(): string {
    const path = transient.read(RETURN_KEY)
    transient.write(RETURN_KEY, null)
    return path ?? '/'
  },
}

function isAuthorizeUrl(url: string | null): boolean {
  try {
    const parsed = new URL(url ?? '')
    return parsed.origin === config.oidcAuthority && parsed.pathname === '/oauth2/authorize'
  } catch {
    return false
  }
}

/**
 * Autorisation d'un client tiers (console, mobile, outils) : identity envoie sur la connexion avec `?continue=` vers
 * son `/oauth2/authorize`. Après la connexion, on y retourne au lieu de rester dans l'app.
 */
export const continueUrl = {
  accept(url: string | null) {
    transient.write(CONTINUE_KEY, isAuthorizeUrl(url) ? url : null)
  },
  /** Reprend l'autorisation tierce mémorisée ; `true` si la page part ailleurs. */
  resume(): boolean {
    const url = transient.read(CONTINUE_KEY)
    if (!url) return false
    transient.write(CONTINUE_KEY, null)
    window.location.assign(url)
    return true
  },
}
