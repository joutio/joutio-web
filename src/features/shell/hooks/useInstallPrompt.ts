import { useInstallStore } from "@/shared/stores/useInstallStore"

export interface InstallPromptState {
  canInstall: boolean
  installed: boolean
  promptInstall: () => Promise<void>
}

/**
 * Installation de la PWA : l'événement `beforeinstallprompt` (Chrome/Edge) est capté au boot
 * par `initInstallPromptCapture` (store partagé) — le réglage monte souvent trop tard pour
 * l'entendre. iOS n'implémente pas l'API : consignes manuelles (`isIos` côté composant).
 */
export function useInstallPrompt(): InstallPromptState {
  const deferred = useInstallStore((state) => state.deferred)
  const installed = useInstallStore((state) => state.installed)
  const promptInstall = useInstallStore((state) => state.promptInstall)

  return {
    canInstall: deferred !== null,
    installed,
    promptInstall,
  }
}
