/// <reference types="vite/client" />

/** Version de l'application injectée au build depuis `package.json` (cf. `vite.config.ts`). */
declare const __APP_VERSION__: string

/** Identifiant du build courant (bannière de mise à jour, cf. `vite.config.ts`). */
declare const __APP_BUILD_ID__: string

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_OIDC_AUTHORITY?: string
  readonly VITE_OIDC_CLIENT_ID?: string
  readonly VITE_OIDC_REDIRECT_URI?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
