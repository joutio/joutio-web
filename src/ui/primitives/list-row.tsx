import { CaretRightIcon, CheckCircleIcon, CircleIcon, RadioButtonIcon, type Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { SwitchTrack } from './switch'

export type ListRowProps = {
  label: string
  sub?: string
  icon?: Icon
  /** Visuel à gauche à la place de l'icône, par exemple un drapeau. */
  leading?: ReactNode
  control?: 'chevron' | 'toggle' | 'check' | 'radio' | 'value' | 'none'
  value?: string
  on?: boolean
  destructive?: boolean
  strong?: boolean
  /** Dernière ligne de la liste : sans filet. */
  last?: boolean
  disabled?: boolean
  /** Pour `chevron`, `value` et `none`. */
  onClick?: () => void
  /** Requis avec `toggle`, `check` et `radio` : toute la ligne pilote l'état. */
  onToggle?: (on: boolean) => void
  'data-state'?: 'pressed' | 'focus'
  className?: string
}

type RowControl = NonNullable<ListRowProps['control']>

const STATE_ROLES: Partial<Record<RowControl, 'switch' | 'checkbox' | 'radio'>> = {
  toggle: 'switch',
  check: 'checkbox',
  radio: 'radio',
}

export function ListRow({
  label,
  sub,
  icon: IconComponent,
  leading,
  control = 'chevron',
  value,
  on = false,
  destructive = false,
  strong = false,
  last = false,
  disabled = false,
  onClick,
  onToggle,
  'data-state': dataState,
  className,
}: ListRowProps) {
  const stateRole = STATE_ROLES[control]
  const SelectIcon = control === 'radio' ? (on ? RadioButtonIcon : CircleIcon) : on ? CheckCircleIcon : CircleIcon

  const content = (
    <>
      {leading && <span className="flex-none" aria-hidden>{leading}</span>}
      {IconComponent && (
        <IconComponent size={20} className={cn('flex-none', destructive ? 'text-jo-wrong' : 'text-jo-muted')} aria-hidden />
      )}
      <span className="grid min-w-0 flex-1">
        <span className={cn('jo-type-body truncate', destructive ? 'text-jo-wrong' : 'text-jo-text', strong && 'font-semibold')}>
          {label}
        </span>
        {sub && <span className="jo-type-caption truncate text-jo-muted">{sub}</span>}
      </span>
      {control === 'toggle' && <SwitchTrack checked={on} />}
      {control === 'chevron' && (
        <span className="jo-type-body flex items-center gap-1 whitespace-nowrap text-jo-muted">
          {value}
          <CaretRightIcon size={14} aria-hidden />
        </span>
      )}
      {control === 'value' && <span className="jo-type-body whitespace-nowrap text-jo-muted">{value}</span>}
      {(control === 'check' || control === 'radio') && (
        <SelectIcon size={24} weight={on ? 'fill' : 'regular'} className={cn('flex-none', on ? 'text-jo-accent-ink' : 'text-jo-muted')} aria-hidden />
      )}
    </>
  )

  return (
    <button
      type="button"
      data-state={dataState}
      disabled={disabled}
      role={stateRole}
      aria-checked={stateRole ? on : undefined}
      onClick={stateRole ? () => onToggle?.(control === 'radio' ? true : !on) : onClick}
      className={cn(
        'jo-transition jo-focus-inset flex w-full items-center gap-3 px-4 py-2 text-left jo-pressed:bg-jo-hover disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer',
        sub ? 'min-h-16' : 'min-h-[50px]',
        !last && 'border-b border-jo-border',
        className,
      )}
    >
      {content}
    </button>
  )
}
