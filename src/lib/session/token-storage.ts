import type { TokenSet } from './session-store'

/** Clé partagée entre onglets : une rotation ou une déconnexion dans un onglet se propage aux autres (`storage`). */
export const TOKEN_KEY = 'joutio.session'

export function readTokens(): TokenSet | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<TokenSet>
    return typeof value.accessToken === 'string' && typeof value.expiresAt === 'number'
      ? { accessToken: value.accessToken, refreshToken: value.refreshToken ?? null, idToken: value.idToken ?? null, expiresAt: value.expiresAt }
      : null
  } catch {
    return null
  }
}

export function writeTokens(tokens: TokenSet | null): void {
  try {
    if (tokens) localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Stockage indisponible (navigation privée stricte) : la session vit le temps de l'onglet.
  }
}

/** Valeurs de session d'un seul aller-retour (PKCE, cible de retour), en `sessionStorage`. */
export const transient = {
  read(key: string): string | null {
    try {
      return sessionStorage.getItem(key)
    } catch {
      return null
    }
  },
  write(key: string, value: string | null): void {
    try {
      if (value === null) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, value)
    } catch {
      // Sans stockage, le retour se fait sur l'accueil.
    }
  },
}
