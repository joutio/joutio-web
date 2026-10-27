import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

// Tokens Arc UI (bottom sheets) importés avant `index.css` : les tokens de l'app,
// déclarés plus bas, l'emportent à spécificité égale (cf. gardes dans `index.css`).
import "@/components/arc/foundation.css"
import "./index.css"
// i18n initialisé avant le rendu : les écrans pré-connexion utilisent la dernière langue
// choisie (localStorage), sinon celle du navigateur (repli fr).
import "@/lib/i18n"
import App from "./App.tsx"
import { initInstallPromptCapture } from "@/shared/stores/useInstallStore"
import { initClientTelemetry } from "@/lib/telemetry"

// `beforeinstallprompt` n'est émis qu'une fois, tôt : la capture doit être branchée avant le
// rendu (le réglage « Installer Joutio » ne monte que plus tard, sur la page Réglages).
initInstallPromptCapture()
// Erreurs JS et promesses rejetées → BFF → Loki/Grafana (aucun SaaS).
initClientTelemetry()

// Cache client des images externes (Wikimedia) : actif en dev comme en prod. Le SW ne touche
// qu'aux hôtes d'images (jamais au shell ni aux bundles), donc HMR reste intact.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .catch(() => undefined)
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
