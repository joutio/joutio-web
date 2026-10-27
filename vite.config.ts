import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8")
) as { version: string }

/**
 * Dev contre la prod : Vite sert le build local sur l'origine publique
 * `app.joutio.com` (port 443, TLS local). C'est la seule origine qui satisfait
 * les trois contraintes d'identity : redirect URI enregistrée, origine autorisée en CORS
 * et cookie de session `AUTH_TX` (`SameSite=Lax`) **same-site** avec `identity.`.
 *
 * Lancement : `scripts/dev-prod.sh` (génère le certificat mkcert, ajoute la résolution
 * locale dans `/etc/hosts`, puis élève Vite sur le port 443).
 */
const DEV_PROD_HOST = "app.joutio.com"
const devProd = process.env.DEV_PROD === "1"
const certDir = path.resolve(import.meta.dirname, "certs")

// Le port 443 exige root : on échoue tôt avec une consigne claire plutôt qu'un EACCES.
if (devProd && process.getuid?.() !== 0) {
  throw new Error(
    "`npm run dev:prod` doit être lancé via `scripts/dev-prod.sh` " +
      "(le port 443 exige sudo et le certificat local)."
  )
}

function devProdHttps(): { cert: Buffer; key: Buffer } {
  const cert = path.join(certDir, "app.pem")
  const key = path.join(certDir, "app-key.pem")

  if (!existsSync(cert) || !existsSync(key)) {
    throw new Error(
      "Certificats absents : lance `scripts/dev-prod.sh` ou " +
        `\`mkcert -cert-file certs/app.pem -key-file certs/app-key.pem ${DEV_PROD_HOST}\`.`
    )
  }

  return { cert: readFileSync(cert), key: readFileSync(key) }
}

/** Identifiant unique de build : détecte un nouveau déploiement (bannière de mise à jour). */
const buildId = Date.now().toString(36)

/** Émet `/version.json` (version + buildId) pour que le client détecte un nouveau build. */
function versionFile(): Plugin {
  return {
    name: "joutio-version-file",
    apply: "build",
    writeBundle(options) {
      const outDir = options.dir ?? path.resolve(import.meta.dirname, "dist")
      writeFileSync(
        path.join(outDir, "version.json"),
        JSON.stringify({ version, buildId })
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  // Version + build de l'app injectés au build (Réglages, détection de mise à jour).
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  // Dev contre la prod — port 443 => privilèges root (cf. scripts/dev-prod.sh).
  server: devProd
    ? {
        // Bind explicite sur la loopback : /etc/hosts fait pointer l'origine prod ici.
        host: "127.0.0.1",
        port: 443,
        strictPort: true,
        https: devProdHttps(),
        allowedHosts: [DEV_PROD_HOST],
        hmr: { host: DEV_PROD_HOST, protocol: "wss", clientPort: 443 },
      }
    : undefined,
  // Sous sudo, le cache Vite appartiendrait à root : on le sort du dépôt, par UID
  // (un lancement direct sans privilèges ne partage donc pas le cache du lancement root).
  cacheDir:
    process.env.VITE_CACHE_DIR ??
    (devProd
      ? `/tmp/joutio-vite-cache-${process.getuid?.() ?? "user"}`
      : "node_modules/.vite"),
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Sépare les dépendances stables (cache navigateur) du code applicatif.
        advancedChunks: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "query",
              test: /node_modules[\\/]@tanstack[\\/]/,
            },
            {
              name: "realtime",
              test: /node_modules[\\/](@stomp[\\/]stompjs|oidc-client-ts)[\\/]/,
            },
            {
              // Les styles DiceBear non embarqués (lorelei/notionists) sont des imports
              // dynamiques : ne pas les forcer dans un groupe commun, sinon ils reviennent
              // dans le chunk de boot (cf. `shared/avatar/styles`).
              name: "motion",
              test: /node_modules[\\/](framer-motion|motion|motion-dom|motion-utils)[\\/]/,
            },
            {
              // Chargé uniquement avec les pages d'auteur (création/gestion), pas au boot.
              name: "emoji",
              test: /node_modules[\\/]emoji-picker-react[\\/]/,
            },
            {
              name: "vendor",
              // `@dicebear` est exclu : ses styles sont chargés à la demande (imports
              // dynamiques) — le forcer ici annulerait le découpage.
              test: /node_modules[\\/](?!@dicebear[\\/])/,
            },
          ],
        },
      },
    },
  },
})
