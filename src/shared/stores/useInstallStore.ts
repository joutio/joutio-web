import { create } from "zustand"
import { isStandalone } from "@/shared/utils/pwa"

/** Événement Chrome/Edge d'installation différée (non typé dans lib.dom). */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const BANNER_DISMISSED_KEY = "joutio.installBanner.dismissed"

function readBannerDismissed(): boolean {
  try {
    return localStorage.getItem(BANNER_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

interface InstallState {
  deferred: BeforeInstallPromptEvent | null
  installed: boolean
  /** Bandeau d'incitation masqué définitivement par l'utilisateur. */
  bannerDismissed: boolean
  capture: (event: BeforeInstallPromptEvent) => void
  markInstalled: () => void
  promptInstall: () => Promise<void>
  dismissBanner: () => void
}

/**
 * État d'installation PWA partagé. `beforeinstallprompt` n'est émis **qu'une fois, tôt**
 * (au chargement) : la capture est branchée au boot (`main.tsx`) et l'événement est conservé
 * ici pour que le réglage « Installer Joutio » puisse le rejouer, où qu'il soit monté ensuite.
 */
export const useInstallStore = create<InstallState>()((set, get) => ({
  deferred: null,
  installed: isStandalone(),
  bannerDismissed: readBannerDismissed(),
  capture: (event) => set({ deferred: event }),
  markInstalled: () => set({ deferred: null, installed: true }),
  promptInstall: async () => {
    const deferred = get().deferred
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    set({ deferred: null })
  },
  dismissBanner: () => {
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, "1")
    } catch {
      // Stockage indisponible (navigation privée) : le masquage vaut pour la session.
    }
    set({ bannerDismissed: true })
  },
}))

let initialized = false

/** À appeler une fois au boot, avant tout rendu (`main.tsx`). */
export function initInstallPromptCapture(): void {
  if (initialized || typeof window === "undefined") return
  initialized = true
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    useInstallStore.getState().capture(event as BeforeInstallPromptEvent)
  })
  window.addEventListener("appinstalled", () => {
    useInstallStore.getState().markInstalled()
  })
}
