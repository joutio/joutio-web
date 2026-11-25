import { isApiError } from '@/lib/api'
import { endSession, loginWithCode, loginRedirect, requestLoginCode } from '@/lib/session'
import { useAction } from '@/shared/use-action'

const sendCode = (email: string) => requestLoginCode(email)

/** Vérifie le code (cookie `AUTH_TX` chez identity), puis enchaîne l'autorisation PKCE : la page quitte l'app. */
async function login({ email, code }: { email: string; code: string }) {
  try {
    await loginWithCode(email, code)
  } catch (error) {
    // Compte suspendu : identity refuse le code (`403`), l'onboarding affiche l'écran dédié.
    if (isApiError(error) && error.statusCode === 403) void endSession('suspended', error.suspendedUntil, error.suspensionReason)
    throw error
  }
  await loginRedirect()
}

/** Envoi du code de connexion par e-mail (identity, hors BFF). */
export const useRequestLoginCode = () => useAction(sendCode)

/** Connexion par code (identity, hors BFF). */
export const useLoginWithCode = () => useAction(login)
