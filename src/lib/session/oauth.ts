import { config } from '../config'
import { ENDPOINTS } from '../endpoints'
import type { TokenSet } from './session-store'

/** Erreurs OAuth qui rendent le refresh token inutilisable : la session est terminée. */
const DEFINITIVE = new Set(['invalid_grant', 'invalid_token', 'invalid_client', 'unauthorized_client'])

/** Échec d'un appel au point de jeton. `definitive` : il faut repasser par la connexion ; sinon, on retente plus tard. */
export class TokenError extends Error {
  readonly definitive: boolean
  constructor(message: string, definitive: boolean) {
    super(message)
    this.name = 'TokenError'
    this.definitive = definitive
  }
}

const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const randomToken = (size = 32) => base64Url(crypto.getRandomValues(new Uint8Array(size)))

/** Défi PKCE S256 dérivé du vérificateur. */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

export function authorizeUrl(params: { state: string; challenge: string }): string {
  const url = new URL(ENDPOINTS.oidc.authorize)
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.oidcClientId,
    redirect_uri: config.oidcRedirectUri,
    scope: config.oidcScope,
    state: params.state,
    code_challenge: params.challenge,
    code_challenge_method: 'S256',
  }).toString()
  return url.toString()
}

type TokenResponse = { access_token: string; refresh_token?: string; id_token?: string; expires_in?: number }

async function tokenRequest(body: Record<string, string>, previous?: TokenSet): Promise<TokenSet> {
  let response: Response
  try {
    response = await fetch(ENDPOINTS.oidc.token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: new URLSearchParams({ client_id: config.oidcClientId, ...body }),
    })
  } catch {
    throw new TokenError('Réseau indisponible', false)
  }
  if (!response.ok) {
    let code = ''
    try {
      code = ((await response.json()) as { error?: string }).error ?? ''
    } catch {
      // Pas de corps OAuth : décision sur le statut.
    }
    // Erreur non reconnue = transitoire : purger une session valide est irréversible, attendre ne l'est pas.
    throw new TokenError(code || `HTTP ${response.status}`, DEFINITIVE.has(code))
  }
  const json = (await response.json()) as TokenResponse
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? previous?.refreshToken ?? null,
    idToken: json.id_token ?? previous?.idToken ?? null,
    expiresAt: Date.now() + (json.expires_in ?? 300) * 1000,
  }
}

export const exchangeCode = (code: string, verifier: string) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: config.oidcRedirectUri, code_verifier: verifier })

export const refreshTokens = (tokens: TokenSet) => {
  if (!tokens.refreshToken) return Promise.reject(new TokenError('Pas de refresh token', true))
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken }, tokens)
}
