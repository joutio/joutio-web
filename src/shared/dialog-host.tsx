import { Dialog } from '@/ui'
import { useDialogStore } from './dialog'

export function DialogHost() {
  const current = useDialogStore((state) => state.current)
  const close = useDialogStore((state) => state.close)
  if (!current) return null
  return (
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
}
