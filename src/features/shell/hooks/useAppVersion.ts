import { useCallback, useEffect, useState } from "react"
import { isStaleBuild, type AppVersionInfo } from "../domain/version"

/** Clé du build ignoré par l'utilisateur (fermeture du bandeau, mémorisée). */
const DISMISSED_KEY = "joutio.updateBanner.dismissedBuild"
/** Fréquence de vérification en arrière-plan (complétée par focus/visibilité). */
const CHECK_INTERVAL_MS = 5 * 60 * 1000

function readDismissedBuild(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY)
  } catch {
    return null
  }
}

/**
 * Détecte un nouveau déploiement de joutio-web : compare le build distant (`/version.json`,
 * émis au build) au build chargé. Vérifié au montage, toutes les 5 min et au retour au premier
 * plan ; silencieux en dev et en cas d'erreur réseau.
 */
export function useAppVersion() {
  const [remoteBuildId, setRemoteBuildId] = useState<string | null>(null)
  const [dismissedBuildId, setDismissedBuildId] = useState(readDismissedBuild)

  useEffect(() => {
    if (import.meta.env.DEV) return
    let cancelled = false

    const check = async () => {
      try {
        const response = await fetch("/version.json", { cache: "no-store" })
        if (!response.ok) return
        const info = (await response.json()) as AppVersionInfo
        if (!cancelled && isStaleBuild(info, __APP_BUILD_ID__)) {
          setRemoteBuildId(info.buildId ?? null)
        }
      } catch {
        // Vérification opportuniste : une erreur réseau ne remonte jamais.
      }
    }

    void check()
    const interval = window.setInterval(check, CHECK_INTERVAL_MS)
    const onResume = () => {
      if (document.visibilityState === "visible") void check()
    }
    document.addEventListener("visibilitychange", onResume)
    window.addEventListener("focus", onResume)
    window.addEventListener("pageshow", onResume)
    window.addEventListener("online", onResume)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onResume)
      window.removeEventListener("focus", onResume)
      window.removeEventListener("pageshow", onResume)
      window.removeEventListener("online", onResume)
    }
  }, [])

  const updateAvailable =
    remoteBuildId != null && remoteBuildId !== dismissedBuildId

  const dismiss = useCallback(() => {
    if (!remoteBuildId) return
    try {
      window.localStorage.setItem(DISMISSED_KEY, remoteBuildId)
    } catch {
      // Stockage indisponible : la fermeture vaut pour la session.
    }
    setDismissedBuildId(remoteBuildId)
  }, [remoteBuildId])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  return { updateAvailable, dismiss, reload }
}
