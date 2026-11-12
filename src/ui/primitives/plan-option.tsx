import { cn } from '../lib/cn'
import { Badge } from './badge'

export type PlanOptionProps = {
  name: string
  price: string
  /** Précision sous le prix, par exemple `2,50 € / mois`. */
  detail?: string
  /** Mise en avant, par exemple `−37 %`. */
  badge?: string
  selected?: boolean
  onSelect?: () => void
  className?: string
}

/** Offre Premium, à placer dans un `radiogroup`. */
export function PlanOption({ name, price, detail, badge, selected = false, onSelect, className }: PlanOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'jo-transition jo-focus relative grid cursor-pointer gap-1 rounded-jo-lg bg-jo-raised p-4 text-left ring-inset jo-pressed:scale-[.98]',
        selected && 'ring-2 ring-jo-accent',
        className,
      )}
    >
      {badge && (
        <Badge variant="accent" className="absolute -top-2.5 right-3">
          {badge}
        </Badge>
      )}
      <span className="jo-type-caption font-semibold text-jo-muted">{name}</span>
      <span className="jo-type-numeric">{price}</span>
      {detail && <span className="jo-type-caption text-jo-muted">{detail}</span>}
    </button>
  )
}
