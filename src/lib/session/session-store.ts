import { create } from 'zustand'

/** Jetons OIDC de la session (client public `web`, Authorization Code + PKCE). */
export type TokenSet = {
  accessToken: string
  refreshToken: string | null
  idToken: string | null
  /** Échéance de l'access token, en ms epoch. */
  expiresAt: number
}

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated'

/** Raison de la dernière fin de session, montrée par l'onboarding (état Session expirée), effacée à la reconnexion. */
export type SessionEndReason = 'expired' | 'unknownUser' | 'suspended'

export type SessionClaims = { userId: string | null; email: string | null; roles: string[] }

type SessionState = {
  status: SessionStatus
  tokens: TokenSet | null
  claims: SessionClaims | null
  endReason: SessionEndReason | null
  /** Suspension : fin annoncée par le serveur (ISO) ; `null`, définitive ou inconnue. */
  suspendedUntil: string | null
  /** Suspension : code du motif annoncé par le serveur. */
  suspensionReason: string | null
}

/** Source unique et réactive de la session : lisible dans React (sélecteurs) comme hors React (`getState()`). */
export const useSessionStore = create<SessionState>(() => ({ status: 'loading', tokens: null, claims: null, endReason: null, suspendedUntil: null, suspensionReason: null }))

/** Charge utile d'un JWT, sans vérification de signature (le BFF vérifie ; le client ne fait que lire). */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='))
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(json, (c) => c.charCodeAt(0)))) as Record<string, unknown>
  } catch {
    return null
  }
}

export function claimsOf(tokens: TokenSet): SessionClaims {
  const payload = decodeJwt(tokens.accessToken) ?? {}
  const str = (value: unknown) => (typeof value === 'string' ? value : null)
  const roles = Array.isArray(payload.roles) ? payload.roles.filter((role): role is string => typeof role === 'string') : []
  return {
    userId: str(payload.user_id) ?? str(payload.sub),
    email: str(payload.email),
    roles: roles.map((role) => (role.startsWith('ROLE_') ? role : `ROLE_${role}`)),
  }
}

export const selectStatus = (state: SessionState) => state.status
export const selectUserId = (state: SessionState) => state.claims?.userId ?? null
export const selectEndReason = (state: SessionState) => state.endReason
export const getAccessToken = () => useSessionStore.getState().tokens?.accessToken ?? null
export const getSessionUserId = () => selectUserId(useSessionStore.getState())
