import { normalizeReferralCode, parseShareUrl } from '@joutio/client-domain/share'

const KEY = 'joutio-referral'

/**
 * Code de parrainage reçu par un lien (`?ref=`, `go.joutio.com/i/{code}` redirigé vers `/?ref=`), gardé jusqu'à la
 * connexion puis appliqué une fois (`partage.md` § 6). Stockage local tolérant : sans lui, le code est perdu.
 */
export const pendingReferral = {
  capture(url: string = window.location.href) {
    const fromQuery = normalizeReferralCode(new URL(url).searchParams.get('ref'))
    const fromLink = parseShareUrl(url)
    const code = fromQuery ?? (fromLink?.kind === 'invite' ? normalizeReferralCode(fromLink.id) : null)
    if (!code) return
    try {
      localStorage.setItem(KEY, code)
    } catch {
      // Stockage indisponible : le joueur peut saisir le code à l'onboarding.
    }
  },
  peek(): string | null {
    try {
      return normalizeReferralCode(localStorage.getItem(KEY))
    } catch {
      return null
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Rien à effacer.
    }
  },
}
