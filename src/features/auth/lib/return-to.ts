const RETURN_TO_KEY = "joutio.returnTo"

/**
 * Cible mémorisée avant authentification (ex. lien de salon `/join/:roomId`), restaurée après
 * login. Portée par `sessionStorage` (survit au round-trip OIDC dans l'onglet) et réinjectée
 * dans le `state` OIDC pour que `/callback` y retourne directement.
 */
export function rememberReturnTo(path: string): void {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path)
  } catch {
    // Stockage indisponible (navigation privée) : la navigation par `state` reste le filet.
  }
}

export function readReturnTo(): string | null {
  try {
    return sessionStorage.getItem(RETURN_TO_KEY)
  } catch {
    return null
  }
}

export function clearReturnTo(): void {
  try {
    sessionStorage.removeItem(RETURN_TO_KEY)
  } catch {
    // Rien à faire : le stockage est indisponible.
  }
}
