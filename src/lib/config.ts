import { z } from "zod"

/**
 * Configuration runtime du web (Vite). Les variables sont injectées via `.env`.
 * Elles sont validées au démarrage : une URL d'API ou d'issuer malformée échoue tôt
 * (message explicite) plutôt qu'au premier appel réseau.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_OIDC_AUTHORITY: z.string().url().optional(),
  VITE_OIDC_CLIENT_ID: z.string().min(1).optional(),
  VITE_OIDC_REDIRECT_URI: z.string().url().optional(),
})

const parsedEnv = envSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  throw new Error(
    `Configuration Vite invalide : ${JSON.stringify(parsedEnv.error.flatten().fieldErrors)}`
  )
}

const env = parsedEnv.data

export const config = {
  apiUrl: env.VITE_API_URL ?? "http://localhost:8092",
  oidcAuthority: env.VITE_OIDC_AUTHORITY ?? "http://localhost:8085",
  oidcClientId: env.VITE_OIDC_CLIENT_ID ?? "web",
  oidcRedirectUri:
    env.VITE_OIDC_REDIRECT_URI ?? `${window.location.origin}/callback`,
  oidcScope: "openid profile email",
} as const
