import { CaretLeftIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Button } from '../primitives/button'
import { IconButton } from '../primitives/icon-button'

type Common = { glass?: boolean; className?: string }

type LargeBar = Common & { variant?: 'large'; title: string; subtitle?: string; left?: ReactNode; right?: ReactNode }

/**
 * Écran poussé : titre centré, retour texte ou élément libre à gauche.
 * `subtitle` : contexte de la page (sujet, adversaire) sous le titre, jamais concaténé au titre.
 */
type InlineBar = Common & { variant: 'inline'; title?: string; subtitle?: string; back?: string; onBack?: () => void; left?: ReactNode; right?: ReactNode }

/** Saisie plein écran : Annuler et Confirmer. */
type ModalBar = Common & {
  variant: 'modal'
  title: string
  cancel?: string
  confirm?: string
  confirmDisabled?: boolean
  onCancel?: () => void
  onConfirm?: () => void
}

/** Sur une image : boutons en pastille, sans fond de barre. */
type MediaBar = Common & { variant: 'media'; onBack?: () => void; right?: ReactNode }

export type MobileTopBarProps = LargeBar | InlineBar | ModalBar | MediaBar

export function MobileTopBar(props: MobileTopBarProps) {
  const glass = props.glass && 'bg-jo-glass backdrop-blur-xl'
  const threeColumns = 'grid h-[52px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2'

  if (props.variant === 'media') {
    return (
      <header className={cn('flex h-[52px] items-center justify-between px-3', props.className)}>
        <IconButton icon={CaretLeftIcon} label="Retour" media onClick={props.onBack} />
        {props.right && <div className="flex gap-2">{props.right}</div>}
      </header>
    )
  }

  if (props.variant === 'modal') {
    const { title, cancel = 'Annuler', confirm = 'OK', confirmDisabled, onCancel, onConfirm } = props
    return (
      <header className={cn(threeColumns, 'px-2', glass, props.className)}>
        <Button variant="plain" size="M" className="justify-self-start font-normal" onClick={onCancel}>
          {cancel}
        </Button>
        <h1 className="jo-type-headline truncate text-center">{title}</h1>
        <Button variant="plain" size="M" className="justify-self-end" disabled={confirmDisabled} onClick={onConfirm}>
          {confirm}
        </Button>
      </header>
    )
  }

  if (props.variant === 'inline') {
    const { title, subtitle, back, onBack, left, right } = props
    return (
      <header className={cn(threeColumns, 'px-2', glass, props.className)}>
        <div className="flex min-w-0 justify-self-start">
          {back ? (
            <Button variant="plain" size="M" icon={CaretLeftIcon} className="px-0 font-normal" onClick={onBack}>
              {back}
            </Button>
          ) : (
            left
          )}
        </div>
        <div className="grid max-w-[200px] min-w-0 text-center">
          <h1 className="jo-type-headline truncate">{title}</h1>
          {subtitle && <p className="jo-type-caption truncate text-jo-muted">{subtitle}</p>}
        </div>
        <div className="flex min-w-0 justify-self-end">{right}</div>
      </header>
    )
  }

  const { title, subtitle, left, right } = props
  return (
    <header className={cn('flex min-h-[52px] items-center gap-2 py-1 pr-2 pl-4', glass, props.className)}>
      {left}
      <div className="grid min-w-0 flex-1">
        <h1 className="jo-type-large-title truncate">{title}</h1>
        {subtitle && <p className="jo-type-callout truncate text-jo-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-none items-center">{right}</div>}
    </header>
  )
}
