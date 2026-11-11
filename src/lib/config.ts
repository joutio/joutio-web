import { z } from 'zod'

/**
 * Configuration runtime, injectée par Vite (`.env.*`, variables du workflow de release). Validée au chargement : une
 * URL malformée échoue tôt avec un message clair. Aucune URL en dur dans le reste de l'app.
 */
const schema = z.object({
  VITE_API_URL: z.url().default('http://localhost:8092'),
  VITE_OIDC_AUTHORITY: z.url().default('http://localhost:8085'),
  VITE_OIDC_CLIENT_ID: z.string().min(1).default('web'),
  VITE_OIDC_REDIRECT_URI: z.url().optional(),
})

const parsed = schema.safeParse(import.meta.env)
if (!parsed.success) {
  throw new Error(`Configuration Vite invalide : ${z.prettifyError(parsed.error)}`)
}

const env = parsed.data

export const config = {
  /** Origine du BFF : seule surface REST + WebSocket. */
  apiUrl: env.VITE_API_URL.replace(/\/$/, ''),
  /** Origine STOMP, dérivée du BFF (`http` → `ws`). */
  wsUrl: `${env.VITE_API_URL.replace(/\/$/, '').replace(/^http/, 'ws')}/ws/websocket`,
  /** Issuer OIDC (`joutio-identity`) : connexion, échange et renouvellement des jetons. */
  oidcAuthority: env.VITE_OIDC_AUTHORITY.replace(/\/$/, ''),
  oidcClientId: env.VITE_OIDC_CLIENT_ID,
  oidcRedirectUri: env.VITE_OIDC_REDIRECT_URI ?? `${window.location.origin}/callback`,
  oidcScope: 'openid profile email',
  version: __APP_VERSION__,
  buildId: __APP_BUILD_ID__,
} as const
