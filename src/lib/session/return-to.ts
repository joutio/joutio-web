import { transient } from './token-storage'

const RETURN_KEY = 'joutio.returnTo'

/** Cible interne à rouvrir après la connexion (lien profond, lien de salon). Chemins internes seulement. */
export const returnTo = {
  remember(path: string | null) {
    transient.write(RETURN_KEY, path && path.startsWith('/') && !path.startsWith('//') ? path : null)
  },
  /** Un lien de salon partagé attend (ouvert sans compte, `partage.md` § 3) : l'onboarding ne crée pas son salon. */
  joinPending(): boolean {
    return transient.read(RETURN_KEY)?.startsWith('/join/') ?? false
  },
  consume(): string {
    const path = transient.read(RETURN_KEY)
    transient.write(RETURN_KEY, null)
    return path ?? '/'
  },
}
