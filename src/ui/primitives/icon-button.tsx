import type { Icon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { buttonCompoundVariants, buttonVariantAxes } from './button-styles'

const iconButtonStyles = cva(
  'jo-transition jo-focus relative grid flex-none place-items-center rounded-jo-full disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer jo-pressed:scale-[.94]',
  {
    variants: {
      ...buttonVariantAxes,
      // La zone invisible de S porte la cible tactile à 44 px sans changer le visuel.
      size: { L: 'size-12', M: 'size-11', S: 'size-9 after:absolute after:-inset-1' },
    },
    compoundVariants: [...buttonCompoundVariants],
    defaultVariants: { variant: 'plain', tone: 'neutral', size: 'M' },
  },
)

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> &
  VariantProps<typeof iconButtonStyles> & {
    icon: Icon
    /** Nom accessible, obligatoire : le bouton n'a pas de texte visible. */
    label: string
    badge?: number | 'dot'
    /** Sur une image : pastille sombre et icône blanche, dans les deux thèmes. */
    media?: boolean
  }

const ICON_SIZE = { L: 24, M: 22, S: 18 } as const

export function IconButton({
  icon: IconComponent,
  label,
  badge,
  media = false,
  variant,
  tone,
  size,
  className,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      data-jo-theme={media ? 'dark' : undefined}
      className={cn(iconButtonStyles({ variant, tone, size }), media && 'bg-jo-scrim', className)}
      {...props}
    >
      <IconComponent size={ICON_SIZE[size ?? 'M']} aria-hidden />
      {badge === 'dot' && (
        <span className="absolute top-2.5 right-2.5 size-2 rounded-jo-full bg-jo-wrong ring-2 ring-jo-bg" />
      )}
      {typeof badge === 'number' && badge > 0 && (
        <span className="jo-type-caption absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] rounded-jo-full bg-jo-accent px-1 text-center leading-[18px] font-semibold text-jo-on-accent ring-2 ring-jo-bg">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
