import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

/**
 * Pile d'en-tête sticky unique : les onglets et la barre de filtres de l'onglet actif vivent
 * dans **un seul** élément collant. Les barres de filtres restent propriétaires de leur état et
 * de leurs données ; seul leur DOM est porté dans le slot du header.
 *
 * Sans provider (fiche joueur, tests), `StickyHeaderFilters` rend ses enfants **sur place** :
 * la barre garde son chrome sticky autonome.
 */
const StickyHeaderSlotContext = createContext<HTMLElement | null>(null)

interface StickyHeaderProviderProps {
  children: ReactNode
}

export function StickyHeaderProvider({ children }: StickyHeaderProviderProps) {
  // Nœud créé une seule fois : le portail peut y rendre immédiatement, même avant que le slot
  // ne soit rattaché au DOM du header.
  const [slot] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.createElement("div")
  )

  return (
    <StickyHeaderSlotContext.Provider value={slot}>
      {children}
    </StickyHeaderSlotContext.Provider>
  )
}

/** Emplacement rendu par `PageHeaderBar` (sous la rangée d'onglets). */
export function StickyHeaderSlot() {
  const slot = useContext(StickyHeaderSlotContext)
  const hostRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host || !slot) return
    host.appendChild(slot)
    return () => {
      slot.remove()
    }
  }, [slot])

  return <div ref={hostRef} data-slot="sticky-header-slot" />
}

type StickyHeaderFiltersChild = ReactNode | ((stacked: boolean) => ReactNode)

interface StickyHeaderFiltersProps {
  /** Seul l'onglet actif porte sa barre de filtres dans le header. */
  active?: boolean
  children: StickyHeaderFiltersChild
}

/**
 * Porte la barre de filtres dans le header sticky quand un provider existe. Le booléen
 * `stacked` permet au composant de retirer son propre chrome (fond, bordure, sticky).
 */
export function StickyHeaderFilters({
  active = true,
  children,
}: StickyHeaderFiltersProps) {
  const slot = useContext(StickyHeaderSlotContext)
  if (!active) return null

  const render = (stacked: boolean) =>
    typeof children === "function" ? children(stacked) : children

  if (!slot) return <>{render(false)}</>
  return createPortal(render(true), slot)
}
