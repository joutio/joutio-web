import { useCallback, useMemo } from "react"
import type { User } from "oidc-client-ts"
import {
  completeLogin as completeLoginOidc,
  loginRedirect,
  logout as logoutOidc,
} from "../lib/oidc"
import {
  selectAuthenticated,
  selectDisplayName,
  selectStatus,
  selectUser,
  selectUserId,
  useSessionStore,
  type SessionStatus,
} from "@/features/auth"

export interface SessionValue {
  user: User | null
  userId: string | null
  displayName: string | null
  authenticated: boolean
  status: SessionStatus
  /** Vrai une fois la session initiale résolue (évite de flasher le login). */
  ready: boolean
  login: (returnTo?: string) => Promise<void>
  completeLogin: () => Promise<User>
  logout: () => Promise<void>
}

/** Accès réactif à la session (remplace l'ancien `AuthContext`). */
export function useSession(): SessionValue {
  const status = useSessionStore(selectStatus)
  const user = useSessionStore(selectUser)
  const userId = useSessionStore(selectUserId)
  const displayName = useSessionStore(selectDisplayName)
  const authenticated = useSessionStore(selectAuthenticated)

  const login = useCallback((returnTo?: string) => loginRedirect(returnTo), [])
  const completeLogin = useCallback(() => completeLoginOidc(), [])
  const logout = useCallback(() => logoutOidc(), [])

  return useMemo(
    () => ({
      user,
      userId,
      displayName,
      authenticated,
      status,
      ready: status !== "loading",
      login,
      completeLogin,
      logout,
    }),
    [
      user,
      userId,
      displayName,
      authenticated,
      status,
      login,
      completeLogin,
      logout,
    ]
  )
}
