import { LockSimpleIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

/** Traitement commun à tout élément de rang verrouillé. */
export const LOCKED_STYLE = 'opacity-40 grayscale'

/** Pastille cadenas, à positionner dans un parent relatif. Décorative : le parent annonce « verrouillé ». */
export function LockBadge({ size, className }: { size: number; className?: string }) {
  return (
    <span
      className={cn('absolute grid place-items-center rounded-jo-full bg-jo-text text-jo-bg', className)}
      style={{ width: size, height: size }}
    >
      <LockSimpleIcon weight="fill" size={size / 2} aria-hidden />
    </span>
  )
}
