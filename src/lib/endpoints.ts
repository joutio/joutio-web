import { config } from './config'

/**
 * Endpoints utilisés par la plomberie. Les données passent par le BFF (`/api/**`, chemins relatifs) ; seuls
 * l'authentification (`/api/auth/web/**`) et le protocole OIDC (`/oauth2/**`) visent `joutio-identity` (absolus).
 * Les endpoints métier s'ajoutent dans le `lib/` de chaque feature, écran par écran.
 */
export const ENDPOINTS = {
  auth: {
    requestLoginCode: `${config.oidcAuthority}/api/auth/web/request-login-code`,
    loginWithCode: `${config.oidcAuthority}/api/auth/web/login-with-code`,
    startGoogleLogin: `${config.oidcAuthority}/api/auth/web/start-google-login`,
    startFacebookLogin: `${config.oidcAuthority}/api/auth/web/start-facebook-login`,
    logout: `${config.oidcAuthority}/api/auth/web/logout`,
  },
  oidc: {
    authorize: `${config.oidcAuthority}/oauth2/authorize`,
    token: `${config.oidcAuthority}/oauth2/token`,
  },
  me: '/api/me',
  telemetry: {
    events: '/api/telemetry/events',
    clientErrors: '/api/telemetry/client-errors',
  },
  push: {
    vapidPublicKey: '/api/push/vapid-public-key',
    subscriptions: '/api/push/subscriptions',
  },
} as const
