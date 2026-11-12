import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export type SwipeHintProps = {
  /** `up` : bandeau en bas d'une page qui en annonce une suivante ; `down` : miroir en haut de la page suivante. */
  direction: 'up' | 'down'
  /** Titre de la page annoncée (bandeau seulement), par exemple « Détails du duel ». */
  title?: string
  /** Geste à faire, par exemple « Glisse vers le haut pour revoir les questions ». Absent sur le miroir (caret seul). */
  hint?: string
  /** Nom accessible : l'action du tap. */
  label: string
  onClick?: () => void
  className?: string
}

/**
 * Annonce d'une page voisine d'un pager vertical (`ResultPages`, `resultat.md` § 6) : caret, titre et geste facultatifs
 * (le miroir en haut de la page 2 n'a que le caret, 2026-11-12).
 * Un tap fait la même bascule que le glissé.
 */
export function SwipeHint({ direction, title, hint, label, onClick, className }: SwipeHintProps) {
  const Caret = direction === 'up' ? CaretUpIcon : CaretDownIcon
  return (
    <button type="button" onClick={onClick} aria-label={label} className={cn('jo-focus-inset grid w-full cursor-pointer justify-items-center gap-0.5 px-4 text-center', className)}>
      <Caret size={20} className="text-jo-muted" aria-hidden />
      {title && <span className="jo-type-headline">{title}</span>}
      {hint && <span className="jo-type-caption max-w-full truncate text-jo-muted">{hint}</span>}
    </button>
  )
}
