import { cn } from '../lib/cn'

/** Piste et curseur, sans comportement : pour un parent déjà interactif, comme ListRow. */
export function SwitchTrack({ checked }: { checked: boolean }) {
  return (
    <span className={cn('jo-transition block h-[31px] w-[51px] flex-none rounded-jo-full p-0.5', checked ? 'bg-jo-accent' : 'bg-jo-hover')}>
      {/* Le curseur reste blanc dans les deux thèmes. */}
      <span
        data-jo-theme="dark"
        className={cn('jo-transition block size-[27px] rounded-jo-full bg-jo-text', checked && 'translate-x-5')}
      />
    </span>
  )
}

export type SwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
  /** Force le focus pour la documentation. */
  'data-state'?: 'focus'
  className?: string
}

export function Switch({ checked, onChange, label, disabled = false, 'data-state': dataState, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-state={dataState}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'jo-focus relative block flex-none rounded-jo-full after:absolute after:inset-x-0 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer',
        className,
      )}
    >
      <SwitchTrack checked={checked} />
    </button>
  )
}
