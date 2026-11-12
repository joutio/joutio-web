import { CircleNotchIcon, type Icon } from '@phosphor-icons/react'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { buttonCompoundVariants, buttonVariantAxes } from './button-styles'

/** Classes du bouton, aussi posées sur un lien (`<a>`) quand l’action navigue. */
export const buttonStyles = cva(
  'jo-transition jo-focus inline-flex min-w-11 items-center justify-center gap-2 rounded-jo-sm font-semibold whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer jo-pressed:scale-[.98]',
  {
    variants: {
      ...buttonVariantAxes,
      size: {
        L: 'jo-type-headline min-h-12 px-5',
        // 40 px visibles, 44 px de cible : zone invisible de 2 px en haut et en bas.
        M: 'jo-type-callout relative min-h-10 px-4 font-semibold after:absolute after:inset-x-0 after:-inset-y-0.5',
        // La zone invisible porte la cible tactile à 44 px sans changer le visuel.
        S: 'jo-type-callout relative min-h-8 px-3 font-semibold after:absolute after:inset-x-0 after:-inset-y-1.5',
      },
      full: { true: 'w-full' },
    },
    compoundVariants: [...buttonCompoundVariants],
    defaultVariants: { variant: 'filled', tone: 'accent', size: 'L' },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & {
    icon?: Icon
    iconPlacement?: 'leading' | 'trailing'
    /** Description sous le titre. Recommandé en L et M. */
    subtitle?: string
    meta?: string
    loading?: boolean
  }

export function Button({
  variant,
  tone,
  size,
  full,
  icon: IconComponent,
  iconPlacement = 'leading',
  subtitle,
  meta,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const iconSize = size === 'S' ? 16 : 20
  const indicator = loading ? (
    <CircleNotchIcon size={iconSize} className="jo-spin" aria-hidden />
  ) : (
    IconComponent && <IconComponent size={iconSize} aria-hidden />
  )

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonStyles({ variant, tone, size, full }), subtitle && 'py-2', className)}
      {...props}
    >
      {iconPlacement === 'leading' && indicator}
      {subtitle ? (
        <span className="grid justify-items-center">
          <span>{children}</span>
          <span className="jo-type-caption opacity-80">{subtitle}</span>
        </span>
      ) : (
        children
      )}
      {meta && <span className="font-mono opacity-65">{meta}</span>}
      {iconPlacement === 'trailing' && indicator}
    </button>
  )
}
