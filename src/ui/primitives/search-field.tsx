import { MagnifyingGlassIcon, XCircleIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { Button } from './button'

export type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Nom accessible. */
  label?: string
  /** Affiche « Annuler » pendant la saisie. */
  onCancel?: () => void
  /** Force l'état actif pour la documentation. */
  active?: boolean
  className?: string
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Rechercher',
  label = 'Rechercher',
  onCancel,
  active = false,
  className,
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const engaged = active || focused || value !== ''

  return (
    <div className={cn('flex w-full items-center gap-2', className)}>
      <div
        className={cn(
          'jo-transition flex h-11 min-w-0 flex-1 items-center gap-2 rounded-jo-full bg-jo-raised px-4 ring-jo-accent ring-inset focus-within:ring-2',
          active && 'ring-2',
        )}
      >
        <MagnifyingGlassIcon size={20} className="flex-none text-jo-muted" aria-hidden />
        <input
          ref={input}
          type="search"
          aria-label={label}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="jo-type-body min-w-0 flex-1 bg-transparent text-jo-text outline-none placeholder:text-jo-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value !== '' && (
          <button type="button" aria-label="Effacer" onClick={() => {
              onChange('')
              input.current?.focus()
            }} className="jo-focus relative flex-none cursor-pointer rounded-jo-full text-jo-muted after:absolute after:-inset-[13px]">
            <XCircleIcon size={18} weight="fill" aria-hidden />
          </button>
        )}
      </div>
      {onCancel && engaged && (
        <Button variant="plain" size="S" onClick={onCancel}>
          Annuler
        </Button>
      )}
    </div>
  )
}
