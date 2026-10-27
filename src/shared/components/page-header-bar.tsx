import type { ReactNode } from "react"
import { cn } from "cn"

interface PageHeaderBarProps {
  children: ReactNode
  /** Répartit le contenu (gauche) et les actions (droite) sur la même ligne. */
  justify?: boolean
  /**
   * Bandeau collant sous la topbar (qui se masque au scroll). Le bloc est décalé par le même
   * `--qu-chrome-shift` que la topbar ; `below` accueille les filtres de l'onglet actif dans le
   * **même** élément sticky (cf. `StickyHeaderStack`).
   */
  sticky?: boolean
  /** Contenu sous la rangée d'onglets, dans la même surface sticky (slot de filtres). */
  below?: ReactNode
  className?: string
}

/**
 * Bandeau de tête de page pleine largeur (onglets, actions) : même largeur max et même
 * gouttière (`--page-gutter-x`) que `PageContainer`, pour des marges alignées sur tous les
 * écrans. À utiliser pour tout nouvel en-tête de page.
 */
export function PageHeaderBar({
  children,
  justify = false,
  sticky = false,
  below,
  className,
}: PageHeaderBarProps) {
  return (
    <div
      data-slot="page-header-bar"
      className={cn(
        "border-b bg-background",
        sticky &&
          "qu-scroll-chrome qu-sticky-follow sticky top-[calc(var(--qu-topbar-offset,0rem)_+_var(--qu-chrome-shift,0px))] z-10 scroll-mt-[calc(var(--qu-topbar-offset,0rem)_+_var(--qu-chrome-shift,0px))]",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-screen-xl flex-wrap items-center gap-3 px-(--page-gutter-x) py-3",
          justify && "justify-between"
        )}
      >
        {children}
      </div>
      {below}
    </div>
  )
}
