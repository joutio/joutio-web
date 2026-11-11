import { ArrowClockwiseIcon, ArrowDownIcon, CheckCircleIcon, CircleNotchIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Button } from '../primitives/button'

export type FeedFooterState = 'more' | 'loading' | 'error' | 'end'

export type FeedFooterProps = {
  state: FeedFooterState
  /** Pages affichées : la fin n'apparaît qu'après au moins une page tirée en plus (`pages > 1`). */
  pages: number
  onLoadMore?: () => void
  onRetry?: () => void
  /** Message de fin de liste. */
  endLabel?: string
  className?: string
}

/**
 * Pied d'une liste paginée. Le pied reste dans le flux : les éléments déjà chargés
 * restent visibles quand la page suivante échoue.
 */
export function FeedFooter({ state, pages, onLoadMore, onRetry, endLabel = 'Tu as tout vu', className }: FeedFooterProps) {
  if (state === 'end' && pages <= 1) return null

  if (state === 'loading') {
    return (
      <div role="status" aria-live="polite" aria-label="Chargement de la suite" className={cn('grid min-h-11 place-items-center py-3 text-jo-muted', className)}>
        <CircleNotchIcon size={24} className="jo-spin" aria-hidden />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div role="alert" className={cn('grid justify-items-center gap-2 rounded-jo-lg border border-jo-border p-4 text-center', className)}>
        <WarningCircleIcon size={20} className="text-jo-wrong" aria-hidden />
        <span className="jo-type-caption text-jo-muted">La suite n'a pas pu se charger.</span>
        <Button variant="plain" tone="accent" size="S" icon={ArrowClockwiseIcon} onClick={onRetry}>
          Réessayer
        </Button>
      </div>
    )
  }

  if (state === 'end') {
    return (
      <div className={cn('flex items-center justify-center gap-2 border-t border-jo-border pt-4 pb-2 text-jo-muted', className)}>
        <CheckCircleIcon size={16} aria-hidden />
        <span className="jo-type-caption">{endLabel}</span>
      </div>
    )
  }

  return (
    <div className={cn('grid justify-items-center', className)}>
      <Button variant="plain" tone="neutral" icon={ArrowDownIcon} onClick={onLoadMore}>
        Charger la suite
      </Button>
    </div>
  )
}
