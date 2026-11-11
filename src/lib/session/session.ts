import { api } from '../api/api-client'
import { ENDPOINTS } from '../endpoints'
import { queryClient } from '../query-client'
import { authorizeUrl, exchangeCode, pkceChallenge, randomToken, refreshTokens, TokenError } from './oauth'
import { registerSessionGateway } from './session-gateway'
import { claimsOf, useSessionStore, type SessionEndReason, type TokenSet } from './session-store'
import { readTokens, TOKEN_KEY, transient, writeTokens } from './token-storage'
import { returnTo } from './return-to'

/**
 * Moteur de session web : OIDC Authorization Code + PKCE auprès de `joutio-identity` (client public `web`), sans
 * bibliothèque. Le renouvellement est piloté (échéance, retour d'onglet, retour réseau, `401`) et single-flight, y
 * compris entre onglets (`navigator.locks`) : la rotation des refresh tokens invaliderait le perdant. Un échec
 * transitoire ne ferme jamais la session ; un échec définitif la ferme avec une raison.
 */

const PKCE_KEY = 'joutio.pkce'
const listeners = new Set<() => void>()

function apply(tokens: TokenSet | null): void {
  writeTokens(tokens)
  useSessionStore.setState((state) => ({
    tokens,
    claims: tokens ? claimsOf(tokens) : null,
    status: tokens ? 'authenticated' : 'anonymous',
    // La raison de fin reste affichée jusqu'à la prochaine connexion.
    endReason: tokens ? null : state.endReason,
  }))
  listeners.forEach((listener) => listener())
}

const expired = (tokens: TokenSet, marginMs = 0) => tokens.expiresAt - Date.now() <= marginMs

export type RefreshResult = { status: 'ok'; tokens: TokenSet } | { status: 'rejected' } | { status: 'unavailable' }

async function renewOnce(): Promise<RefreshResult> {
  // Un autre onglet a peut-être déjà renouvelé : on relit le stockage partagé.
  const stored = readTokens()
  const current = useSessionStore.getState().tokens
  if (stored && !expired(stored, 30_000) && stored.accessToken !== current?.accessToken) {
    apply(stored)
    return { status: 'ok', tokens: stored }
  }
  const source = stored ?? current
  if (!source) return { status: 'rejected' }
  try {
    const tokens = await refreshTokens(source)
    apply(tokens)
    return { status: 'ok', tokens }
  } catch (error) {
    return error instanceof TokenError && error.definitive ? { status: 'rejected' } : { status: 'unavailable' }
  }
}

let inFlight: Promise<RefreshResult> | null = null

/** Renouvellement unique : les appels concurrents partagent la même promesse. Ne ferme jamais la session. */
export function refreshSession(): Promise<RefreshResult> {
  inFlight ??= (navigator.locks?.request ? navigator.locks.request('joutio-session-refresh', renewOnce) : renewOnce()).finally(() => {
    inFlight = null
  })
  return inFlight
}

/** Pour les déclencheurs automatiques : un échec définitif ferme la session (`expired`), un transitoire est ignoré. */
export async function refreshSessionOrEnd(): Promise<TokenSet | null> {
  const result = await refreshSession()
  if (result.status === 'rejected') {
    await endSession('expired')
    return null
  }
  return result.status === 'ok' ? result.tokens : null
}

/** Purge locale : jetons, cache des requêtes, statut anonyme. */
export function clearSession(): void {
  apply(null)
  queryClient.clear()
}

/** Fin de session subie, avec sa raison. */
export async function endSession(reason: SessionEndReason): Promise<void> {
  useSessionStore.setState({ endReason: reason })
  clearSession()
  return Promise.resolve()
}

/** Le joueur a pris connaissance de la fin de session : l'onboarding repasse à la connexion. */
export function dismissEndReason(): void {
  useSessionStore.setState({ endReason: null })
}

/** Restaure la session au démarrage ; renouvelle si l'access token est expiré. */
export async function initSession(): Promise<void> {
  const tokens = readTokens()
  if (!tokens) return apply(null)
  if (!expired(tokens)) return apply(tokens)
  apply(tokens)
  const result = await refreshSession()
  // Transitoire : on garde la session, le prochain déclencheur rejouera le renouvellement.
  if (result.status === 'rejected') await endSession('expired')
}

/** Lance l'autorisation PKCE (après une connexion par code ou un retour de connexion sociale). */
export async function loginRedirect(target?: string): Promise<void> {
  if (target) returnTo.remember(target)
  const verifier = randomToken(48)
  const state = randomToken(16)
  transient.write(PKCE_KEY, JSON.stringify({ verifier, state }))
  window.location.assign(authorizeUrl({ state, challenge: await pkceChallenge(verifier) }))
}

/** Retour sur `/callback` : vérifie l'état, échange le code, ouvre la session. Rend la cible de retour. */
export async function completeLogin(search: string): Promise<string> {
  const params = new URLSearchParams(search)
  const error = params.get('error')
  if (error) throw new Error(params.get('error_description') ?? error)
  const raw = transient.read(PKCE_KEY)
  transient.write(PKCE_KEY, null)
  const pending = raw ? (JSON.parse(raw) as { verifier: string; state: string }) : null
  const code = params.get('code')
  if (!pending || !code || params.get('state') !== pending.state) throw new Error('Retour de connexion invalide')
  apply(await exchangeCode(code, pending.verifier))
  return returnTo.consume()
}

/** Connexion par code (étape 1) : envoie le code par email. */
export const requestLoginCode = (email: string) =>
  api.post<void>(ENDPOINTS.auth.requestLoginCode, { email }, { anonymous: true, credentials: 'include' })

/** Connexion par code (étape 2) : ouvre la session d'autorisation (cookie `AUTH_TX`), puis le PKCE prend le relais. */
export const loginWithCode = (email: string, code: string) =>
  api.post<{ userId: string; email: string }>(ENDPOINTS.auth.loginWithCode, { email, code }, { anonymous: true, credentials: 'include' })

/** Connexion sociale : navigation complète vers identity, retour sur `/welcome?social=success`. */
export function startSocialLogin(provider: 'google' | 'facebook', target?: string): void {
  if (target) returnTo.remember(target)
  window.location.assign(provider === 'google' ? ENDPOINTS.auth.startGoogleLogin : ENDPOINTS.auth.startFacebookLogin)
}

/** Déconnexion volontaire : révoque l'autorisation côté identity, puis purge, même si identity ne répond pas. */
export async function logout(): Promise<void> {
  const refreshToken = useSessionStore.getState().tokens?.refreshToken
  try {
    await api.post<void>(ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : {}, { anonymous: true, credentials: 'include' })
  } catch {
    // Session déjà close côté serveur : la purge locale suffit.
  }
  clearSession()
}

// Multi-onglets : rotation ou déconnexion dans un autre onglet.
window.addEventListener('storage', (event) => {
  if (event.key !== TOKEN_KEY) return
  const tokens = readTokens()
  if (tokens?.accessToken !== useSessionStore.getState().tokens?.accessToken) {
    useSessionStore.setState({ tokens, claims: tokens ? claimsOf(tokens) : null, status: tokens ? 'authenticated' : 'anonymous' })
    listeners.forEach((listener) => listener())
  }
})

registerSessionGateway({
  getAccessToken: () => useSessionStore.getState().tokens?.accessToken ?? null,
  refresh: async () => (await refreshSessionOrEnd())?.accessToken ?? null,
  end: endSession,
  subscribe: (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
})
