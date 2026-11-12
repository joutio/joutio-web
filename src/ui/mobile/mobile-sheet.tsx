import type { ReactNode } from 'react'
import { Drawer } from 'vaul'
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

/**
 * Sheet rendue dans l'écran (absolute, sans portail : elle reste dans la colonne de `WebFrame`). Sur le web, le geste,
 * le voile, le focus et Échap viennent de Vaul (décision du 2026-11-12) : on la tire vers le bas pour la fermer, un
 * contenu qui défile ne la ferme qu'une fois revenu en haut. Une zone balayable horizontalement (carrousel) porte
 * `data-vaul-no-drag`.
 */
export function MobileSheet({ open, onClose, title, subtitle, onBack, action, tall = false, footer, children }: MobileSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(next) => !next && onClose()} noBodyStyles repositionInputs={false}>
      <Drawer.Overlay className="absolute inset-0 z-20 bg-jo-scrim" />
      <Drawer.Content
        aria-describedby={undefined}
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-jo-xl bg-jo-surface pb-[var(--jo-safe-bottom,0px)] outline-none',
          tall ? 'h-[92%]' : 'max-h-[80%]',
        )}
      >
        <Drawer.Title className="sr-only">{title}</Drawer.Title>
        <SheetHeader title={title} subtitle={subtitle} onBack={onBack} action={action} onClose={onClose} />
        <div className={cn('jo-no-scrollbar min-h-0 flex-auto overflow-y-auto px-4', footer ? 'pb-2' : 'pb-4')}>{children}</div>
        {footer && <div className="flex-none px-4 pt-2 pb-4">{footer}</div>}
      </Drawer.Content>
    </Drawer.Root>
  )
}
