import { useEffect } from "react"

/**
 * Expose la hauteur du `visualViewport` (clavier virtuel mobile) en variable CSS `--vvh`
 * sur `<html>`. Les dialogues plein écran s'y plafonnent pour garder l'en-tête et le footer
 * visibles clavier ouvert (iOS Safari, où `dvh` ne suit pas le clavier).
 */
export function useVisualViewportVar(): void {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const root = document.documentElement
    const update = () => {
      root.style.setProperty("--vvh", `${Math.round(viewport.height)}px`)
    }

    update()
    viewport.addEventListener("resize", update)
    viewport.addEventListener("scroll", update)
    return () => {
      viewport.removeEventListener("resize", update)
      viewport.removeEventListener("scroll", update)
      root.style.removeProperty("--vvh")
    }
  }, [])
}
