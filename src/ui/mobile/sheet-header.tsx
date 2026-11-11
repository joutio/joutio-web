import { CaretLeftIcon, XIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { IconButton } from '../primitives/icon-button'

export type SheetHeaderProps = {
  title: string
  subtitle?: string
  onBack?: () => void
  /** Remplace le bouton Fermer. */
  action?: ReactNode
  onClose?: () => void
}

export function SheetHeader({ title, subtitle, onBack, action, onClose }: SheetHeaderProps) {
  return (
    <div className="grid w-full gap-1 px-2 pt-2 pb-1">
      <span className="h-[5px] w-9 justify-self-center rounded-jo-xs bg-jo-border" />
      <div className="grid grid-cols-[minmax(44px,1fr)_auto_minmax(44px,1fr)] items-center gap-2">
        <span className="flex justify-self-start">
          {onBack && <IconButton icon={CaretLeftIcon} label="Retour" variant="gray" onClick={onBack} />}
        </span>
        <div className="grid min-w-0 text-center">
          <h2 className="jo-type-headline truncate">{title}</h2>
          {subtitle && <span className="jo-type-caption text-jo-muted">{subtitle}</span>}
        </div>
        <span className="flex justify-self-end">
          {action ?? (onClose && <IconButton icon={XIcon} label="Fermer" variant="gray" onClick={onClose} />)}
        </span>
      </div>
    </div>
  )
}
