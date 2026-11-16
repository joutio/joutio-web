import { createPortal } from 'react-dom'
import { Dialog, useTopSheetLayer } from '@/ui'
import { useDialogStore } from './dialog'

/**
 * Dialogue global (`showDialog`). Feuille ouverte : il se rend dans le calque de la feuille du dessus, seul endroit qui
 * reçoit encore pointeur et focus sous la modale Vaul (2026-11-16) ; sinon dans l'écran.
 */
export function DialogHost() {
  const current = useDialogStore((state) => state.current)
  const close = useDialogStore((state) => state.close)
  const layer = useTopSheetLayer()
  if (!current) return null
  const dialog = (
    <Dialog
      {...current}
      open
      onClose={close}
      actions={current.actions.map((action) => ({
        ...action,
        onClick: () => {
          close()
          action.onClick?.()
        },
      }))}
    />
  )
  return layer ? createPortal(dialog, layer) : dialog
}
