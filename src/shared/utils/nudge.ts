const NUDGE_CLASS = "qu-nudge"
const NUDGE_DURATION_MS = 700

let clearTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Secousse d'écran « wizz » (façon MSN) : la classe d'animation est posée sur la racine du
 * document le temps du motif puis retirée — rejouable (un wizz pendant un précédent repart
 * proprement). Neutralisée par `prefers-reduced-motion` (CSS). Sans effet hors navigateur.
 */
export function triggerScreenNudge(): void {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.classList.remove(NUDGE_CLASS)
  // Force le navigateur à reprendre l'animation (lecture de style après retrait).
  void root.offsetWidth
  root.classList.add(NUDGE_CLASS)
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => root.classList.remove(NUDGE_CLASS), NUDGE_DURATION_MS)
}
