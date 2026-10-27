import { playSuccessChime } from "@/shared/audio"
import { showToast, type ShowToastOptions } from "./toast"

/**
 * Confirmation de succès standard : joue le « ding » discret (best-effort, respecte le réglage
 * « Sons ») puis affiche le toast du **gabarit unique** (ton succès). À privilégier pour toute
 * action enregistrée.
 */
export function showSuccessToast(
  message: string,
  options?: Omit<ShowToastOptions, "title" | "tone">
): void {
  playSuccessChime()
  showToast({ tone: "success", title: message, ...options })
}
