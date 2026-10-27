import type { CSSProperties, ReactNode } from "react"
import { cn } from "cn"
import { ScrollArea } from "@/components/arc/scroll-area/scroll-area"
import { useIsTouchLayout } from "@/shared/hooks/use-device"

interface HorizontalRailProps {
  children: ReactNode
  /** Nom accessible de la région défilante (une région par rail). */
  label?: string
  /** Longueur des fondus d'extrémité en desktop (px). Ignoré en tactile. */
  fade?: number
  /** `scroll-snap-type` natif, identique dans les deux modes. */
  snap?: CSSProperties["scrollSnapType"]
  /** Molette verticale → défilement horizontal (desktop uniquement). */
  wheelToHorizontal?: boolean
  /** Classes du conteneur défilant (flex, gap, padding bas). */
  viewportClassName?: string
  /**
   * `scroll-padding-inline` du viewport (repère d'aimantation). En tactile, la gouttière de
   * page est ajoutée automatiquement puisque le rail est full-bleed.
   */
  scrollPaddingInline?: string
}

/**
 * Rail horizontal de cartes.
 *
 * En **desktop** (≥ 1024 px), le contenu est borné par le `PageContainer` : l'Arc `ScrollArea`
 * fournit sa barre fine en surimpression et ses fondus d'extrémité.
 *
 * En **compact/tablette**, le rail occupe **toute la largeur du contenu** (full-bleed) : les
 * marges négatives annulent la gouttière du `PageContainer` et le padding interne la réintroduit,
 * de sorte que la première carte reste alignée sur le titre de section. Le défilement est alors
 * **natif** (swipe, molette, snap) : aucune barre, aucun masque, donc aucune carte ne disparaît
 * sous un chrome. Le composant doit rester enfant du contenu d'un `PageContainer`.
 */
export function HorizontalRail({
  children,
  label,
  fade = 28,
  snap,
  wheelToHorizontal = false,
  viewportClassName,
  scrollPaddingInline,
}: HorizontalRailProps) {
  const isTouch = useIsTouchLayout()

  if (!isTouch) {
    return (
      <ScrollArea
        data-slot="horizontal-rail"
        orientation="horizontal"
        label={label}
        fade={fade}
        snap={snap}
        wheelToHorizontal={wheelToHorizontal}
        viewportClassName={viewportClassName}
        viewportStyle={
          scrollPaddingInline ? { scrollPaddingInline } : undefined
        }
      >
        {children}
      </ScrollArea>
    )
  }

  return (
    <div
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={0}
      data-slot="horizontal-rail"
      data-native=""
      className={cn(
        // Full-bleed : annule la gouttière du PageContainer, puis la réintroduit à l'intérieur
        // (avec les safe-areas) pour que la première carte reste alignée sur la page.
        "qu-hide-scrollbar -mx-[var(--page-gutter-x)] w-[calc(100%+2*var(--page-gutter-x))] overflow-x-auto overflow-y-hidden overscroll-x-contain ps-[calc(var(--page-gutter-x)+var(--qu-safe-left))] pe-[calc(var(--page-gutter-x)+var(--qu-safe-right))]",
        viewportClassName
      )}
      style={{
        scrollSnapType: snap,
        scrollPaddingInline: scrollPaddingInline
          ? `calc(var(--page-gutter-x) + ${scrollPaddingInline})`
          : undefined,
      }}
    >
      {children}
    </div>
  )
}
