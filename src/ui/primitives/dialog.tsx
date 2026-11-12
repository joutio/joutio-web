import type { Icon } from '@phosphor-icons/react'
import { useEffect, useId, useRef } from 'react'
import { firstFocusable, trapTab } from '../lib/focus'
import { cn } from '../lib/cn'
import { Button, type ButtonProps } from './button'

const TONES = {
  neutral: 'bg-jo-raised text-jo-text',
  accent: 'bg-jo-warm text-jo-accent-ink',
  danger: 'bg-jo-wrong/16 text-jo-wrong',
}

export type DialogAction = Pick<ButtonProps, 'variant' | 'tone'> & { label: string; onClick?: () => void }

export type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  message?: string
  icon?: Icon
  tone?: keyof typeof TONES
  actions: DialogAction[]
  /** Présentation en bas d'écran plutôt qu'au centre. */
  sheet?: boolean
}

/** Confirmation rendue dans l'écran du téléphone (absolute), sans portail global. */
export function Dialog({ open, onClose, title, message, icon: IconComponent, tone = 'neutral', actions, sheet = false }: DialogProps) {
  const titleId = useId()
  const messageId = useId()
  const panel = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // L'action principale prend le focus ; à la fermeture, il revient à l'élément qui a ouvert le dialog.
  // Ne dépend que de `open` : `onClose` change à chaque rendu chez l'appelant.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    firstFocusable(panel.current)?.focus()
    return () => opener?.focus()
  }, [open])

  if (!open) return null

  return (
    <div className={cn('absolute inset-0 z-20 flex justify-center', sheet ? 'items-end' : 'items-center px-4')}>
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-jo-scrim" />
      <section
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? messageId : undefined}
        onKeyDown={trapTab}
        className={cn(
          'relative grid w-full justify-items-center gap-2 bg-jo-surface px-4 pt-6 pb-4 text-center text-jo-text shadow-jo',
          sheet ? 'rounded-t-jo-xl pb-[calc(16px+var(--jo-safe-bottom,0px))]' : 'max-w-[360px] rounded-jo-xl',
        )}
      >
        {IconComponent && (
          <span className={cn('mb-1 grid size-14 place-items-center rounded-jo-md', TONES[tone])}>
            <IconComponent size={28} weight="fill" aria-hidden />
          </span>
        )}
        <h2 id={titleId} className="jo-type-title-2 text-balance">{title}</h2>
        {message && <p id={messageId} className="jo-type-body text-pretty text-jo-muted">{message}</p>}
        <div className="mt-3 grid w-full gap-2">
          {actions.map(({ label, variant = 'gray', tone: actionTone = variant === 'filled' ? 'accent' : 'neutral', onClick }) => (
            <Button
              key={label}
              full
              variant={variant}
              tone={actionTone}
              size={variant === 'plain' ? 'M' : 'L'}
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
        </div>
      </section>
    </div>
  )
}
