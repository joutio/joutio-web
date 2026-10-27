import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * Conteneur centré des pages (hors duel) : max-width 1280px, padding horizontal responsive.
 * Équivalent Tailwind du PageContainer de la maquette.
 */
interface PageContainerProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

export function PageContainer({
  children,
  className,
  style,
}: PageContainerProps) {
  return (
    <div
      data-slot="page-container"
      className={cn(
        "mx-auto w-full max-w-screen-xl px-(--page-gutter-x) py-6 pb-8",
        className
      )}
      style={style}
    >
      {children}
    </div>
  )
}
