import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { tokens, type CategoryCode } from '../tokens.generated'

export type CategoryTileProps = {
  category: CategoryCode
  selected?: boolean
  /** Limite de choix atteinte. */
  disabled?: boolean
  onToggle?: (selected: boolean) => void
  className?: string
}

/** Choix d'un univers à l'onboarding, en grille de 3 colonnes. */
export function CategoryTile({ category, selected = false, disabled = false, onToggle, className }: CategoryTileProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onToggle?.(!selected)}
      className={cn(
        'jo-transition jo-focus grid h-16 min-w-0 content-center justify-items-center gap-1 rounded-jo-md px-1.5 py-2 text-center enabled:cursor-pointer jo-pressed:scale-[.98] disabled:opacity-40',
        selected ? 'bg-jo-text text-jo-bg' : 'bg-jo-raised text-jo-text ring-1 ring-jo-border ring-inset',
        className,
      )}
    >
      <CategoryIcon category={category} size={20} weight={selected ? 'fill' : 'regular'} />
      <span className="jo-type-caption max-w-full truncate font-semibold">{tokens.category[category].label}</span>
    </button>
  )
}
