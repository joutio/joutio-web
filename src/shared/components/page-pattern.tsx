import type { CSSProperties } from "react"
import { cn } from "cn"

interface PagePatternProps {
  /** Couleur du motif (variable CSS ou hex). Défaut : couleur de texte du thème. */
  tint?: string
  /** Opacité forcée (0–1). Par défaut, pilotée par `.page-pattern` (contraste doux). */
  opacity?: number
  /** Taille de la tuile répétée (`mask-size`). Défaut défini par `.qu-pattern` (280 px). */
  size?: string
  className?: string
}

/**
 * Fond de page : **papier peint doodle officiel de WhatsApp** (`assets/background.svg`, planche de
 * 374 × 666) utilisé via l'utilitaire `.qu-pattern` — le SVG sert de masque, la teinte vient de
 * `background-color`. Couche décorative fixe, posée derrière le contenu de la colonne principale.
 * Rendu « conversation » : tuile de **280 px** par défaut (gribouillis ~36 px, la maille de la
 * toile du duel) ; le shell passe la tuile native de **374 px** via `--qu-shell-pattern-size`
 * (gribouillis ~48 px, l'échelle de la capture WhatsApp), **dans les deux thèmes**. Opacité douce
 * (`.page-pattern` : 5 % en clair, 8 % en sombre — ajustable via `--qu-pattern-opacity`).
 * Le fichier n'étant **pas** un motif raccord (tracés coupés au bord de la planche), la densité
 * et le contraste sont les deux seuls réglages : `--qu-pattern-size` / `--qu-pattern-opacity`.
 */
export function PagePattern({
  tint = "var(--foreground)",
  opacity,
  size,
  className,
}: PagePatternProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "page-pattern qu-pattern pointer-events-none absolute inset-0 z-0",
        className
      )}
      style={{
        backgroundColor: tint,
        ...(opacity != null ? { opacity } : {}),
        ...(size ? ({ "--qu-pattern-size": size } as CSSProperties) : {}),
      }}
    />
  )
}
