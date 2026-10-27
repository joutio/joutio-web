import type { KeyboardEvent, ReactNode } from "react"
import { cn } from "cn"

interface EntityTileProps {
  /** Visuel de tête : icône de sujet ou avatar. */
  visual: ReactNode
  title: string
  trailing?: ReactNode
  onClick?: () => void
  className?: string
  dataSlot?: string
}

/**
 * Tuile **springboard iOS** : visuel arrondi et nom centré dessous, **sans carte, fond ni
 * bordure** — le fond de page reste visible. Le nom réserve **deux lignes** (clamp 2 lignes)
 * pour que toutes les tuiles d'une rangée aient la même hauteur ; le survol pose un fond
 * discret, l'appui réduit légèrement la tuile.
 */
export function EntityTile({
  visual,
  title,
  trailing,
  onClick,
  className,
  dataSlot,
}: EntityTileProps) {
  const interactive = Boolean(onClick)

  const handleKeyDown = interactive
    ? (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.()
        }
      }
    : undefined

  return (
    <div
      data-slot={dataSlot}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={title}
      className={cn(
        "group flex flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center transition-[background-color,transform]",
        interactive &&
          "cursor-pointer hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:scale-[0.97]",
        className
      )}
    >
      {visual}
      <div className="line-clamp-2 min-h-8 w-full font-heading text-xs leading-tight font-extrabold tracking-tight break-words hyphens-auto tablet-up:min-h-9 tablet-up:text-sm">
        {title}
      </div>
      {trailing}
    </div>
  )
}
