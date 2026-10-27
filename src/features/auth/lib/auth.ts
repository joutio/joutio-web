import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"

export interface AuthResponse {
  userId: string
  email: string
}

/**
 * API JSON d'authentification passwordless du web (code OTP email).
 *
 * <p>`requestLoginCode` demande un code
 * (`POST /api/auth/web/request-login-code`) ; `loginWithCode` établit la session
 * interactive temporaire (`POST /api/auth/web/login-with-code`, cookie `AUTH_TX`).
 * Le pipeline OIDC (code d'autorisation + PKCE) est ensuite déclenché par
 * `loginRedirect`.</p>
 */
export const authService = {
  requestLoginCode: (email: string): Promise<void> =>
    api.post<void>(
      ENDPOINTS.auth.requestLoginCode,
      { email },
      {
        absolute: true,
        credentials: "include",
        skipErrorBus: true,
        skipAuthRefresh: true,
      }
    ),

  loginWithCode: (email: string, code: string): Promise<AuthResponse> =>
    api.post<AuthResponse>(
      ENDPOINTS.auth.loginWithCode,
      { email, code },
      {
        absolute: true,
        credentials: "include",
        skipErrorBus: true,
        skipAuthRefresh: true,
      }
    ),

  logout: (refreshToken?: string): Promise<void> =>
    api.post<void>(
      ENDPOINTS.auth.logout,
      refreshToken ? { refreshToken } : {},
      {
        absolute: true,
        credentials: "include",
        skipErrorBus: true,
        skipAuthRefresh: true,
      }
    ),
}
