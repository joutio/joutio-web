import { useLayoutEffect, useRef, useState } from 'react'
import { TitleRibbon } from '../brand/title-ribbon'
import { cn } from '../lib/cn'
import type { TierCode } from '../tokens.generated'
import { ProgressBar } from './progress-bar'

export type TitleRowProps = {
  tier: TierCode
  title: string
  topic?: string
  progress?: { value: number; label: string }
  worn?: boolean
  locked?: boolean
  onWear?: () => void
  last?: boolean
  className?: string
}

/** Toucher la ligne porte/enlève le titre ; le ruban est borné à la ligne et tronqué si nécessaire. */
export function TitleRow({ tier, title, progress, worn = false, locked = false, onWear, last = false, className }: TitleRowProps) {
  const container = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(220)
  useLayoutEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(([entry]) => setAvailableWidth(entry?.contentRect.width ?? 220))
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])
  const interactive = !locked && Boolean(onWear)
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={locked ? `${title}, verrouillé` : `${worn ? 'Enlever' : 'Porter'} ${title}`}
      aria-pressed={interactive ? worn : undefined}
      onClick={interactive ? onWear : undefined}
      onKeyDown={(event) => { if (interactive && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onWear?.() } }}
      className={cn('relative overflow-hidden flex min-h-16 items-center gap-3 px-4 py-2', interactive && 'cursor-pointer hover:bg-jo-hover focus-visible:outline-2 focus-visible:outline-jo-accent', !last && 'border-b border-jo-border', className)}
    >
      <div ref={container} className="grid min-w-0 flex-1 gap-1">
        <TitleRibbon tier={tier} text={title} width={availableWidth} state={locked ? 'locked' : 'earned'} />
        {locked && progress && <ProgressBar value={progress.value} label={progress.label} tone={tier} />}
      </div>
      {worn && <span aria-hidden="true" className="pointer-events-none absolute -right-4 top-3 w-20 rotate-45 bg-jo-correct text-jo-bg text-center jo-type-caption font-semibold">Porté</span>}
    </div>
  )
}
