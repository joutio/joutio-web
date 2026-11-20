import { ShareNetworkIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { TabsScrollView } from '../mobile/tabs-scroll-view'
import { Button } from './button'
import { IconButton } from './icon-button'
import { PageDots } from './page-dots'
import { useT } from '@/lib/i18n'

export type UnlockSequenceProps = {
  /** Tous les déblocages (`RankPromotion`, `TitleUnlock`, `BadgeUnlock`…), à balayer (défilement natif aimanté, comme Détails du duel) ; `step` désigne celui affiché. */
  slides: readonly ReactNode[]
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
export function UnlockSequence({ slides, onStepChange, step = 0, steps = 1, last = false, onContinue, onSkip, onShare, className }: UnlockSequenceProps) {
  const t = useT()
  return (
    <div data-jo-theme="dark" className={cn('relative isolate flex h-full flex-col overflow-hidden bg-jo-bg pt-[var(--jo-safe-top,0px)] text-jo-text', className)}>
      <div className="relative grid h-[52px] flex-none grid-cols-[1fr_auto_1fr] items-center pr-2 pl-4">
        <span />
        <PageDots count={steps} index={step} />
        {!last && (
          <Button variant="plain" tone="neutral" size="M" className="justify-self-end" onClick={onSkip}>
            {t('ds.skipAll')}
          </Button>
        )}
      </div>
      {/* Le déblocage tient entre les deux barres, sans défiler (2026-11-16) : son héros se comprime. */}
      <TabsScrollView
        contained
        className="min-h-0 flex-1"
        value={String(step)}
        onChange={(next) => onStepChange?.(Number(next))}
        pages={slides.map((slide, index) => ({
          value: String(index),
          content: <div className="flex h-full flex-col overflow-hidden">{slide}</div>,
        }))}
      />
      <div className="grid flex-none grid-cols-[52px_minmax(0,1fr)] gap-2 px-5 pt-3 pb-[calc(var(--jo-safe-bottom,0px)+24px)]">
        <IconButton icon={ShareNetworkIcon} label={t('profile.share')} variant="gray" size="L" className="w-[52px] rounded-jo-sm" onClick={onShare} />
        <Button full onClick={onContinue}>
          {last ? t('ds.seeResult') : t('onboarding.universes.continue')}
        </Button>
      </div>
    </div>
  )
}
