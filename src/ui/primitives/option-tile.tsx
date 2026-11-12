import { cn } from '../lib/cn'

export type OptionTileProps = {
  label: string
  image: string
  selected?: boolean
  onSelect?: () => void
  className?: string
}

/** Choix visuel d'une option, à placer dans un `radiogroup`. */
export function OptionTile({ label, image, selected = false, onSelect, className }: OptionTileProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn('jo-transition jo-focus grid min-w-0 cursor-pointer justify-items-center gap-1 rounded-jo-md bg-jo-surface p-2 jo-pressed:scale-[.98]', selected && 'ring-2 ring-jo-accent ring-inset', className)}
    >
      <img src={image} alt="" className="aspect-square w-full rounded-jo-sm object-cover" />
      <span className={cn('jo-type-caption w-full truncate text-center', selected ? 'font-semibold text-jo-text' : 'text-jo-muted')}>{label}</span>
    </button>
  )
}
