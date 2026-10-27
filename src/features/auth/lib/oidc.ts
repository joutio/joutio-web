import { User, UserManager, WebStorageStateStore } from "oidc-client-ts"
import { config } from "@/lib/config"
import { queryClient } from "@/lib/query-client"
import { registerSessionGateway } from "@/lib/session"
import { authService } from "./auth"
import { classifyRefreshFailure } from "./session-errors"
import {
  getRefreshToken,
  getSessionUser as currentUser,
  useSessionStore,
  type SessionEndReason,
} from "../stores/useSessionStore"

/**
 * Moteur OIDC (Authorization Code + PKCE) unique. L'échange de tokens se fait auprès de
 * l'issuer `joutio-identity` ; les appels métier passent par la gateway.
 *
 * Ce module câble `oidc-client-ts` sur le store de session (source unique) et enregistre
 * le `SessionGateway` consommé par `lib/` (client HTTP, WebSocket). Aucun état global
 * parallèle : `useSessionStore` est la seule vérité.
 *
 * Le renouvellement est **piloté** (`automaticSilentRenew: false`) : il est déclenché à
 * l'approche de l'expiration (`useSessionRefresh`), sur `401` (rejeu par le client HTTP) et
 * à la reprise d'onglet/réseau. Un échec **transitoire** (réseau, 5xx) ne purge jamais la
 * session ; seul un échec **définitif** (`invalid_grant`…) ou un `user_id` inconnu du BFF
 * termine la session avec une raison affichée au login.
 */
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: config.oidcRedirectUri,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: config.oidcScope,
  loadUserInfo: false,
  automaticSilentRenew: false,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})

const USER_STORE_KEY = `user:${config.oidcAuthority}:${config.oidcClientId}`

const sessionListeners = new Set<() => void>()

function syncUser(user: User | null): void {
  useSessionStore.getState().setUser(user)
  sessionListeners.forEach((listener) => listener())
}

userManager.events.addUserLoaded((user) => syncUser(user))
userManager.events.addUserUnloaded(() => syncUser(null))

// Multi-onglets : un logout ou une rotation de refresh token dans un autre onglet met à
// jour le stockage partagé ; on resynchronise le store (et les WS) sans recharger la page.
window.addEventListener("storage", (event) => {
  if (event.key !== USER_STORE_KEY) return
  void userManager.getUser().then((user) => syncUser(user))
})

/** Purge locale : retire les tokens du stockage, vide le cache et repasse en anonyme. */
export async function clearSession(): Promise<void> {
  syncUser(null)
  await userManager.removeUser()
  queryClient.clear()
}

/**
 * Fin de session explicite (refresh définitif, `user_id` inconnu du BFF) : la raison est
 * conservée jusqu'à la prochaine connexion pour le message dédié de `/login`.
 */
export async function endSession(reason: SessionEndReason): Promise<void> {
  useSessionStore.getState().setEndReason(reason)
  await clearSession()
}

/** Déconnexion volontaire : révoque l'autorisation identity puis purge localement. */
export async function logout(): Promise<void> {
  try {
    await authService.logout(getRefreshToken() ?? undefined)
  } catch {
    // session déjà expirée : on purge quand même côté client
  }
  await clearSession()
}

/**
 * Résultat d'un renouvellement : `ok` (nouveau user), `rejected` (refresh token inutilisable,
 * définitif) ou `unavailable` (échec transitoire — la session reste intacte).
 */
export type RefreshResult =
  | { status: "ok"; user: User }
  | { status: "rejected" }
  | { status: "unavailable" }

async function renewOnce(): Promise<RefreshResult> {
  // Un autre onglet a peut-être déjà rafraîchi : on recharge depuis le stockage partagé.
  const stored = await userManager.getUser()
  if (stored && !stored.expired) {
    syncUser(stored)
    return { status: "ok", user: stored }
  }
  try {
    const user = await userManager.signinSilent()
    if (!user) return { status: "rejected" }
    syncUser(user)
    return { status: "ok", user }
  } catch (error) {
    return classifyRefreshFailure(error) === "definitive"
      ? { status: "rejected" }
      : { status: "unavailable" }
  }
}

let refreshPromise: Promise<RefreshResult> | null = null

/**
 * Renouvellement single-flight : plusieurs 401 concurrents (ou un renew qui chevauche)
 * ne déclenchent qu'une seule requête `refresh_token` (la rotation `reuse-refresh-tokens:
 * false` invaliderait le perdant). Le verrou `navigator.locks` étend la garantie aux
 * autres onglets. Ne purge jamais l'état : la décision est portée par l'appelant.
 */
export function refreshSession(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise

  const execute = (): Promise<RefreshResult> =>
    navigator.locks?.request
      ? navigator.locks.request("joutio-session-refresh", renewOnce)
      : renewOnce()

  refreshPromise = execute().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

/**
 * Variante « tout-en-un » des points d'entrée automatiques (client HTTP, timer) : un échec
 * définitif termine la session (`expired`), un échec transitoire est ignoré sans purge.
 */
export async function refreshSessionOrEnd(): Promise<User | null> {
  const result = await refreshSession()
  if (result.status === "rejected") {
    await endSession("expired")
    return null
  }
  return result.status === "ok" ? result.user : null
}

export async function initSession(): Promise<User | null> {
  try {
    const user = await userManager.getUser()
    if (user?.expired) {
      const result = await refreshSession()
      if (result.status === "rejected") {
        await endSession("expired")
        return null
      }
      if (result.status === "unavailable") {
        // Transitoire : on garde le refresh token et le statut authentifié ; le timer de
        // `useSessionRefresh` ou le prochain 401 rejouera le renouvellement.
        syncUser(user)
        return user
      }
      syncUser(result.user)
      return result.user
    }
    syncUser(user)
    return user
  } catch {
    // Stockage illisible (JSON corrompu, localStorage indisponible) : purge locale.
    await clearSession()
    return null
  }
}

export async function loginRedirect(returnTo?: string): Promise<void> {
  await userManager.signinRedirect({ state: returnTo })
}

export async function completeLogin(): Promise<User> {
  const user = await userManager.signinRedirectCallback()
  syncUser(user)
  return user
}

// Le client HTTP et le WebSocket lisent le token via ce gateway (pas d'import inverse).
registerSessionGateway({
  getAccessToken: () => currentUser()?.access_token ?? null,
  refresh: async () => (await refreshSessionOrEnd())?.access_token ?? null,
  clear: clearSession,
  subscribe: (listener) => {
    sessionListeners.add(listener)
    return () => {
      sessionListeners.delete(listener)
    }
  },
})

export type { User }
