import { ShareNetworkIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Carousel } from '../web/carousel'
import { Button } from './button'
import { IconButton } from './icon-button'
import { PageDots } from './page-dots'

export type UnlockSequenceProps = {
  /** Déblocage affiché : `RankPromotion`, `TitleUnlock` ou `BadgeUnlock`. Ignoré avec `slides`. */
  children?: ReactNode
  /** Web : tous les déblocages, à balayer (Embla) ; `step` désigne celui affiché. */
  slides?: readonly ReactNode[]
  /** Déblocage atteint au balayage. */
  onStepChange?: (step: number) => void
  step?: number
  steps?: number
  /** Dernier écran : « Voir le résultat », sans « Tout passer ». */
  last?: boolean
  onContinue?: () => void
  onSkip?: () => void
  /** Partage le déblocage affiché. */
  onShare?: () => void
  className?: string
}

/**
 * Plein écran de la séquence de déblocages après un duel : points, « Tout passer », puis Partager et
 * Continuer autour du déblocage courant. Toujours sombre : le héros y brille mieux.
 */
export function UnlockSequence({ children, slides, onStepChange, step = 0, steps = 1, last = false, onContinue, onSkip, onShare, className }: UnlockSequenceProps) {
  return (
    <div data-jo-theme="dark" className={cn('relative isolate flex h-full flex-col overflow-hidden bg-jo-bg pt-[var(--jo-safe-top,0px)] text-jo-text', className)}>
      <div className="relative grid h-[52px] flex-none grid-cols-[1fr_auto_1fr] items-center pr-2 pl-4">
        <span />
        <PageDots count={steps} index={step} />
        {!last && (
          <Button variant="plain" tone="neutral" size="M" className="justify-self-end" onClick={onSkip}>
            Tout passer
          </Button>
        )}
      </div>
      {/* Le déblocage défile entre les deux barres quand l'écran est trop court. */}
      {slides ? (
        <Carousel label="Déblocages" className="flex-1" slideClassName="flex flex-col" slides={slides} index={step} onIndexChange={(next) => onStepChange?.(next)} />
      ) : (
        <div className="jo-no-scrollbar flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-contain">{children}</div>
      )}
      <div className="grid flex-none grid-cols-[52px_minmax(0,1fr)] gap-2 px-5 pt-3 pb-[calc(var(--jo-safe-bottom,0px)+24px)]">
        <IconButton icon={ShareNetworkIcon} label="Partager" variant="gray" size="L" className="w-[52px] rounded-jo-sm" onClick={onShare} />
        <Button full onClick={onContinue}>
          {last ? 'Voir le résultat' : 'Continuer'}
        </Button>
      </div>
    </div>
  )
}
