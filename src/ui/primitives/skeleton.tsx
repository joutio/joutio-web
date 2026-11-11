import { cn } from '../lib/cn'

const SHAPES = {
  text: 'h-4 rounded-jo-xs',
  row: 'h-11 rounded-jo-sm',
  card: 'h-[180px] rounded-jo-lg',
  circle: 'aspect-square rounded-jo-full',
}

export type SkeletonProps = {
  shape?: keyof typeof SHAPES
  /** Largeur CSS. Par défaut, toute la largeur disponible. */
  width?: number | string
  /** `false` hors connexion : squelette fixe, sans pulsation. */
  animated?: boolean
  className?: string
}

/** Garde la forme de la page pendant le chargement. Toujours préféré à un spinner. */
export function Skeleton({ shape = 'text', width, animated = true, className }: SkeletonProps) {
  return <div aria-hidden style={{ width }} className={cn('bg-jo-raised', SHAPES[shape], animated && 'jo-skeleton', className)} />
}
