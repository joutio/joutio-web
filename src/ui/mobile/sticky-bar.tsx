import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export type StickyBarProps = {
  /** Prévient l'écran, par exemple pour afficher un titre compact. */
  onStuckChange?: (stuck: boolean) => void
  className?: string
  children: ReactNode
}

/**
 * Collée en haut du conteneur qui défile, dès qu'elle l'atteint. Le filet n'apparaît qu'une fois
 * collée. L'ombre couvre le pixel que la réduction du téléphone laisse visible au bord du défilement.
 * À placer hors d'une grille : un élément collé ne quitte pas sa cellule. Sur mobile,
 * `stickyHeaderIndices`.
 */
export function StickyBar({ onStuckChange, className, children }: StickyBarProps) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const element = sentinel.current
    if (!element) return
    const main = element.closest('main')
    const screen = element.closest<HTMLElement>('[data-jo-screen]')
    if (!main) return
    const update = () => {
      const distance = Math.max(0, element.offsetTop - main.offsetTop)
      const dock = Math.max(0, Math.min(1, 1 - (distance - main.scrollTop) / Math.min(8, distance || 8)))
      screen?.style.setProperty('--jo-tabs-dock', String(dock))
      setStuck(main.scrollTop >= distance)
    }
    update()
    main.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(main)
    return () => {
      main.removeEventListener('scroll', update)
      observer.disconnect()
      screen?.style.removeProperty('--jo-tabs-dock')
    }
  }, [])

  useEffect(() => onStuckChange?.(stuck), [onStuckChange, stuck])

  return (
    <>
      <div ref={sentinel} aria-hidden />
      <div className={cn('sticky top-0 z-10 bg-jo-bg shadow-[0_-1px_0_var(--jo-bg)]', className)}>{children}<div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-jo-border" style={{ opacity: 'calc(var(--jo-header-edge, 0) * var(--jo-tabs-dock, 0))' }} /></div>
    </>
  )
}
