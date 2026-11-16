import { useCallback, useSyncExternalStore } from 'react'

/**
 * Calques des feuilles ouvertes (`MobileSheet`), de la plus ancienne à la plus récente. Une feuille Vaul est une modale
 * Radix : tant qu'elle est ouverte, le reste de l'écran ne reçoit plus de pointeur ni de focus (`pointer-events: none`
 * sur le `body`), et un clic dehors la ferme. Un dialogue global (`DialogHost`) se rend donc **dans** le calque de la
 * feuille du dessus, jamais à côté (2026-11-16 : les boutons de la déclaration de droits ne répondaient plus quand on
 * choisissait une vignette depuis une feuille).
 */
let layers: readonly HTMLElement[] = []
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const top = () => layers.at(-1) ?? null

/** Calque de la feuille du dessus, `null` sans feuille ouverte. */
export function useTopSheetLayer(): HTMLElement | null {
  return useSyncExternalStore(subscribe, top, top)
}

/** Vrai quand un dialogue occupe ce calque : la feuille garde alors Échap et les clics pour lui. */
export const layerInUse = (layer: HTMLElement | null) => Boolean(layer && layer.childElementCount > 0)

/** Calque d'une feuille : recouvre son contenu, ne capte rien tant qu'il est vide. */
export function SheetLayer({ onLayer }: { onLayer?: (layer: HTMLElement | null) => void }) {
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      onLayer?.(node)
      if (!node) return
      layers = [...layers, node]
      emit()
      return () => {
        layers = layers.filter((layer) => layer !== node)
        emit()
      }
    },
    [onLayer],
  )
  return <div ref={ref} data-jo-sheet-layer data-vaul-no-drag className="pointer-events-none absolute inset-0 z-30 *:pointer-events-auto" />
}
