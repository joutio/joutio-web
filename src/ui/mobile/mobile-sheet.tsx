import { useEffect, useRef, type ReactNode } from 'react'
import { firstFocusable, trapTab } from '../lib/focus'
import { cn } from '../lib/cn'
import { SheetHeader } from './sheet-header'

export type MobileSheetProps = {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  onBack?: () => void
  action?: ReactNode
  /** Hauteur fixe de grande feuille : le contenu remplit l'espace. */
  tall?: boolean
  /** Actions, toujours visibles sous le contenu qui défile. */
  footer?: ReactNode
  children: ReactNode
}

/** Sheet rendue dans l'écran du téléphone (absolute), sans portail global. */
export function MobileSheet({ open, onClose, title, subtitle, onBack, action, tall = false, footer, children }: MobileSheetProps) {
  const panel = useRef<HTMLElement>(null)

  // À l'ouverture, le focus entre dans la feuille ; à la fermeture, il revient à l'élément qui l'a ouverte.
  // Ne dépend que de `open` : `onClose` change à chaque rendu chez l'appelant.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    firstFocusable(panel.current)?.focus({ preventScroll: true })
    return () => opener?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <div className={cn('absolute inset-0 z-20 overflow-hidden', !open && 'pointer-events-none')} inert={!open}>
      <div
        aria-hidden
        onClick={onClose}
        className={cn('jo-sheet-scrim absolute inset-0 bg-jo-scrim', open ? 'opacity-100' : 'opacity-0')}
      />
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={trapTab}
        className={cn(
          'jo-sheet-panel absolute inset-x-0 bottom-0 flex flex-col rounded-t-jo-xl bg-jo-surface pb-[var(--jo-safe-bottom,0px)]',
          tall ? 'h-[92%]' : 'max-h-[80%]',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <SheetHeader title={title} subtitle={subtitle} onBack={onBack} action={action} onClose={onClose} />
        <div className={cn('jo-no-scrollbar min-h-0 flex-auto overflow-y-auto px-4', footer ? 'pb-2' : 'pb-4')}>{children}</div>
        {footer && <div className="flex-none px-4 pt-2 pb-4">{footer}</div>}
      </section>
    </div>
  )
}
