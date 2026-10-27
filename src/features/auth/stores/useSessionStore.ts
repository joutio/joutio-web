import { create } from "zustand"
import type { User } from "oidc-client-ts"

/**
 * Source unique et réactive de la session OIDC (même pattern que le thème : store Zustand
 * + provider d'effets). Le stockage des tokens reste porté par `oidc-client-ts`
 * (`WebStorageStateStore`) : ce store n'est **pas** persisté, il expose le snapshot courant
 * et le rend lisible aussi bien dans React (sélecteurs) qu'en dehors (`getState()`).
 */
export type SessionStatus = "loading" | "anonymous" | "authenticated"

/** Raison de la dernière fin de session, affichée sur `/login` (effacée à la reconnexion). */
export type SessionEndReason = "expired" | "unknownUser" | "suspended"

interface SessionState {
  status: SessionStatus
  user: User | null
  endReason: SessionEndReason | null
  setUser: (user: User | null) => void
  setStatus: (status: SessionStatus) => void
  setEndReason: (reason: SessionEndReason) => void
}

export const useSessionStore = create<SessionState>((set) => ({
  status: "loading",
  user: null,
  endReason: null,
  setUser: (user) =>
    set((state) => ({
      user,
      status: user ? "authenticated" : "anonymous",
      // La fin de session conserve sa raison jusqu'à la prochaine connexion.
      endReason: user ? null : state.endReason,
    })),
  setStatus: (status) => set({ status }),
  setEndReason: (endReason) => set({ endReason }),
}))

export const selectStatus = (state: SessionState): SessionStatus => state.status
export const selectUser = (state: SessionState): User | null => state.user
export const selectEndReason = (state: SessionState): SessionEndReason | null =>
  state.endReason

export const selectUserId = (state: SessionState): string | null => {
  const profile = state.user?.profile as
    { user_id?: string; sub?: string } | undefined
  return profile?.user_id ?? profile?.sub ?? null
}

export const selectDisplayName = (state: SessionState): string | null => {
  const profile = state.user?.profile as
    { email?: string; preferred_username?: string } | undefined
  return profile?.preferred_username ?? profile?.email ?? null
}

export const selectAuthenticated = (state: SessionState): boolean =>
  state.user !== null

/**
 * Rôles portés par le JWT (claim `roles`), normalisés avec le préfixe `ROLE_`.
 * L'autorisation réelle reste serveur ; ce sélecteur sert uniquement à l'UX (flags d'accès
 * anticipé, affichage conditionnel).
 */
export const selectRoles = (state: SessionState): string[] => {
  const roles = (state.user?.profile as { roles?: unknown } | undefined)?.roles
  if (!Array.isArray(roles)) {
    return []
  }
  return roles
    .filter((role): role is string => typeof role === "string")
    .map((role) => (role.startsWith("ROLE_") ? role : `ROLE_${role}`))
}

export const selectIsAdmin = (state: SessionState): boolean =>
  selectRoles(state).includes("ROLE_ADMIN")

/**
 * Accesseurs non réactifs pour les couches data (clés React Query, services) : l'identité
 * est stable pendant toute la session (un changement d'utilisateur déclenche un rechargement).
 * L'UI qui doit réagir à l'auth utilise les sélecteurs (`useSessionStore(selectX)`).
 */
export function getSessionUser(): User | null {
  return useSessionStore.getState().user
}

export function getSessionUserId(): string | null {
  return selectUserId(useSessionStore.getState())
}

export function getSessionDisplayName(): string | null {
  return selectDisplayName(useSessionStore.getState())
}

export function getAccessToken(): string | null {
  return useSessionStore.getState().user?.access_token ?? null
}

export function getSessionRoles(): string[] {
  return selectRoles(useSessionStore.getState())
}

export function getIsAdmin(): boolean {
  return selectIsAdmin(useSessionStore.getState())
}

export function getRefreshToken(): string | null {
  return useSessionStore.getState().user?.refresh_token ?? null
}
