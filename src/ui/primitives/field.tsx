import { WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import { useId, useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  /** Texte libre à droite du libellé, par exemple `12/80`. */
  counter?: string
  /** Zone de texte de 96 px. */
  multiline?: boolean
  /** Affiche le bouton d'effacement quand le champ a une valeur. */
  onClear?: () => void
  /** Force le focus pour la documentation. */
  'data-state'?: 'focus'
}

export function Field({
  label,
  hint,
  error,
  counter,
  multiline = false,
  onClear,
  id,
  className,
  disabled,
  value,
  'data-state': dataState,
  ...props
}: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const messageId = `${inputId}-message`
  const input = useRef<HTMLInputElement>(null)
  const shared = {
    id: inputId,
    disabled,
    value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || hint ? messageId : undefined,
    className: 'jo-type-body min-w-0 flex-1 resize-none bg-transparent text-jo-text outline-none placeholder:text-jo-muted',
  }

  return (
    <div className={cn('grid w-full content-start gap-2', disabled && 'opacity-40', className)}>
      {(label || counter) && (
        <div className="flex justify-between gap-2">
          <label htmlFor={inputId} className="jo-type-callout">
            {label}
          </label>
          {counter && <span className={cn('jo-type-caption font-mono', error ? 'text-jo-wrong' : 'text-jo-muted')}>{counter}</span>}
        </div>
      )}
      <div
        data-state={dataState}
        className={cn(
          'jo-transition flex gap-2 rounded-jo-sm bg-jo-raised py-3 pr-2 pl-3.5 ring-1 ring-jo-border ring-inset',
          multiline ? 'min-h-24 items-start' : 'min-h-12 items-center',
          error ? 'ring-2 ring-jo-wrong' : 'focus-within:ring-2 focus-within:ring-jo-accent data-[state=focus]:ring-2 data-[state=focus]:ring-jo-accent',
        )}
      >
        {multiline ? (
          <textarea {...shared} rows={3} {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input ref={input} {...shared} {...props} />
        )}
        {onClear && value !== undefined && value !== '' && !multiline && !disabled && (
          <button type="button" aria-label="Effacer" onClick={() => {
              onClear()
              input.current?.focus()
            }} className="jo-focus relative flex-none cursor-pointer rounded-jo-full text-jo-muted after:absolute after:-inset-3">
            <XCircleIcon size={20} weight="fill" aria-hidden />
          </button>
        )}
      </div>
      {error ? (
        <span id={messageId} role="alert" className="jo-type-caption flex items-center gap-1 text-jo-wrong">
          <WarningCircleIcon size={16} weight="fill" aria-hidden />
          {error}
        </span>
      ) : (
        hint && (
          <span id={messageId} className="jo-type-caption text-jo-muted">
            {hint}
          </span>
        )
      )}
    </div>
  )
}
