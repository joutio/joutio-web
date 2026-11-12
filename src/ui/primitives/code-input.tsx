import { useState } from 'react'
import { cn } from '../lib/cn'

export type CodeInputProps = {
  value: string
  onChange: (value: string) => void
  length?: number
  error?: boolean
  /** Nom accessible. */
  label?: string
  /** Force le focus pour la documentation. */
  focused?: boolean
  /** Focus à l'ouverture de l'écran. */
  autoFocus?: boolean
  className?: string
}

/** Code à usage unique : un seul champ réel, posé sur les cases affichées. */
export function CodeInput({ value, onChange, length = 6, error = false, label = 'Code reçu par e-mail', focused = false, autoFocus = false, className }: CodeInputProps) {
  const [hasFocus, setHasFocus] = useState(false)
  const showCaret = (focused || hasFocus) && !error

  return (
    <div
      className={cn('relative grid w-full gap-2', className)}
      style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
    >
      {Array.from({ length }, (_, index) => {
        const current = showCaret && index === Math.min(value.length, length - 1)
        return (
          <span
            key={index}
            aria-hidden
            className={cn(
              'jo-type-numeric grid h-[52px] place-items-center rounded-jo-sm bg-jo-raised',
              error && 'ring-2 ring-jo-wrong ring-inset',
              current && 'ring-2 ring-jo-accent ring-inset',
            )}
          >
            {value[index] ?? (current && <span className="h-6 w-0.5 bg-jo-accent" />)}
          </span>
        )
      })}
      <input
        autoFocus={autoFocus}
        aria-label={label}
        aria-invalid={error || undefined}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={length}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, ''))}
        onFocus={() => setHasFocus(true)}
        onBlur={() => setHasFocus(false)}
        className="absolute inset-0 cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent"
      />
    </div>
  )
}
