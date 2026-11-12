import { cn } from '../lib/cn'

export type ColorSwatchProps = {
  /** Couleur choisie par le joueur : une donnée, pas un token. */
  color: string
  /** Nom lisible par les lecteurs d'écran. */
  label: string
  selected?: boolean
  onSelect?: () => void
  className?: string
}

/** Pastille de couleur, à placer dans un `radiogroup`. La bordure marque la sélection. */
export function ColorSwatch({ color, label, selected = false, onSelect, className }: ColorSwatchProps) {
  return (
    <button type="button" role="radio" aria-checked={selected} aria-label={label} onClick={onSelect} className={cn('jo-focus grid size-11 flex-none cursor-pointer place-items-center rounded-jo-full', className)}>
      <span className={cn('size-8 rounded-jo-full ring-1 ring-jo-border', selected && 'outline-2 outline-offset-2 outline-jo-accent')} style={{ backgroundColor: color }} />
    </button>
  )
}
