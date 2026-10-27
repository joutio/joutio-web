import { useCallback, useEffect, useRef } from "react"
import type { RefObject } from "react"
import { CHROME_MOTION_MS } from "@/shared/theme/tokens"
import {
  isRelayout,
  isScrolled,
  nextHeaderHidden,
} from "@/shared/utils/scroll-direction"

interface UseScrollHeaderOptions {
  /**
   * Le repli du chrome n'est actif qu'en compact et hors écrans à chrome dédié. Désactivé, le
   * hook continue de piloter `data-scrolled` (verre dépoli) mais n'écrit jamais l'état masqué.
   */
  enabled?: boolean
  /**
   * Notifié à chaque bascule (et une fois à la remise à zéro). Sert aux composants React qui ne
   * peuvent pas lire l'attribut CSS (nav basse). Le hook lui-même ne provoque **aucun re-render**.
   */
  onHiddenChange?: (hidden: boolean) => void
}

interface UseScrollHeaderResult {
  /** Repart visible et recale la baseline (restauration de scroll, navigation). */
  reset: () => void
}

/** Laisse le garde anti-liseré (`data-chrome-shifting`) en place jusqu'à la fin de la transition. */
const SHIFTING_LINGER_MS = CHROME_MOTION_MS + 40

/**
 * Après une révélation, un micro-scroll descendant (rebond, repositionnement du doigt) ne doit
 * pas refermer le chrome : le header sticky ferait alors un aller-retour de 64 px très visible.
 * On verrouille le masquage le temps de la transition, sans retarder un masquage demandé plus
 * tard ni une nouvelle révélation (masqué → visible reste immédiat).
 */
const REVEAL_GRACE_MS = SHIFTING_LINGER_MS

/** Expose l'état du chrome au CSS sans re-render React (`data-scrolled`). */
function syncScrolledAttribute(element: HTMLElement, scrollTop: number): void {
  element.toggleAttribute("data-scrolled", isScrolled(scrollTop))
}

/**
 * Détecte la direction du scroll du conteneur applicatif (le document ne défile pas) pour
 * masquer/révéler l'en-tête comme une app native. Les mises à jour sont limitées à la frame
 * (`requestAnimationFrame`) ; les scrolls de restauration sont ignorés
 * (`data-scroll-restoring`, posé par `useScrollRestoration`).
 *
 * L'état masqué est **impératif** : `data-chrome-hidden` et `data-chrome-shifting` sont posés sur
 * le conteneur, et la topbar comme les bandes collantes sont animées en CSS. Aucun `useState` ici :
 * la page n'est pas re-rendue au début du geste, donc l'animation démarre dans la même frame.
 *
 * Un contenu **remis en page** (changement d'onglet, filtrage, liste plus courte) fait émettre un
 * `scroll` au navigateur — rognage de la position ou ré-ancrage — qui n'est pas un geste :
 * l'en-tête ne bascule pas, sinon un simple clic sur un onglet ferait apparaître la topbar et la
 * nav basse.
 */
export function useScrollHeader(
  containerRef: RefObject<HTMLElement | null>,
  options: UseScrollHeaderOptions = {}
): UseScrollHeaderResult {
  const { enabled = true, onHiddenChange } = options
  const hiddenRef = useRef(false)
  const previousRef = useRef(0)
  const previousHeightRef = useRef<number | null>(null)
  const onHiddenChangeRef = useRef(onHiddenChange)
  const shiftingTimerRef = useRef<number | null>(null)
  const hideLockedUntilRef = useRef(0)

  useEffect(() => {
    onHiddenChangeRef.current = onHiddenChange
  }, [onHiddenChange])

  const markShifting = useCallback((element: HTMLElement) => {
    if (shiftingTimerRef.current !== null) {
      window.clearTimeout(shiftingTimerRef.current)
    }
    element.setAttribute("data-chrome-shifting", "")
    shiftingTimerRef.current = window.setTimeout(() => {
      element.removeAttribute("data-chrome-shifting")
      shiftingTimerRef.current = null
    }, SHIFTING_LINGER_MS)
  }, [])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    let frame = 0
    previousRef.current = element.scrollTop
    previousHeightRef.current = element.scrollHeight
    hiddenRef.current = false
    hideLockedUntilRef.current = 0
    element.removeAttribute("data-chrome-hidden")
    element.removeAttribute("data-chrome-shifting")
    onHiddenChangeRef.current?.(false)
    syncScrolledAttribute(element, element.scrollTop)

    const update = () => {
      frame = 0
      const scrollTop = element.scrollTop
      const scrollHeight = element.scrollHeight
      // Le verre dépend uniquement de la position réelle, jamais d'un geste : il suit aussi
      // les rognages de remise en page et les restaurations de scroll.
      syncScrolledAttribute(element, scrollTop)
      if (!enabled) return
      if (element.dataset.scrollRestoring === "true") {
        previousRef.current = scrollTop
        previousHeightRef.current = scrollHeight
        return
      }
      const delta = scrollTop - previousRef.current
      const relayout = isRelayout({
        scrollHeight,
        previousScrollHeight: previousHeightRef.current,
      })
      previousRef.current = scrollTop
      previousHeightRef.current = scrollHeight
      // Remise en page du contenu : la baseline est recalée, l'état de l'en-tête inchangé.
      if (relayout) return
      const next = nextHeaderHidden(hiddenRef.current, { scrollTop, delta })
      if (next === hiddenRef.current) return
      // Une révélation qui vient de commencer protège le chrome contre un rebond descendant.
      if (next && performance.now() < hideLockedUntilRef.current) return
      hiddenRef.current = next
      if (!next) {
        hideLockedUntilRef.current = performance.now() + REVEAL_GRACE_MS
      }
      element.toggleAttribute("data-chrome-hidden", next)
      markShifting(element)
      onHiddenChangeRef.current?.(next)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }

    element.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      element.removeEventListener("scroll", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
      if (shiftingTimerRef.current !== null) {
        window.clearTimeout(shiftingTimerRef.current)
        shiftingTimerRef.current = null
      }
      element.removeAttribute("data-chrome-hidden")
      element.removeAttribute("data-chrome-shifting")
      delete element.dataset.scrolled
      hideLockedUntilRef.current = 0
      onHiddenChangeRef.current?.(false)
    }
  }, [containerRef, enabled, markShifting])

  const reset = useCallback(() => {
    const element = containerRef.current
    const scrollTop = element?.scrollTop ?? 0
    previousRef.current = scrollTop
    previousHeightRef.current = element?.scrollHeight ?? null
    hideLockedUntilRef.current = 0
    if (!element) {
      hiddenRef.current = false
      onHiddenChangeRef.current?.(false)
      return
    }
    syncScrolledAttribute(element, scrollTop)
    const wasHidden = hiddenRef.current
    hiddenRef.current = false
    element.removeAttribute("data-chrome-hidden")
    if (wasHidden) markShifting(element)
    onHiddenChangeRef.current?.(false)
  }, [containerRef, markShifting])

  return { reset }
}
