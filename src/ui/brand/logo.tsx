export type LogoProps = {
  variant?: 'mark' | 'lockup'
  /** Hauteur en px. */
  size?: number
  className?: string
}

export function Logo({ variant = 'mark', size = 32, className }: LogoProps) {
  const mark = <img src="/brand/logo-mark.svg" alt="Joutio" style={{ height: size }} className={variant === 'mark' ? className : undefined} />
  if (variant === 'mark') return mark

  // Le mot-symbole est du texte DOM : il suit le thème, ce qu'un SVG en <img> ne peut pas faire.
  return (
    <span className={`inline-flex items-center ${className ?? ''}`} style={{ gap: size * 0.24 }}>
      {mark}
      <span aria-hidden className="font-sans font-bold tracking-tight text-jo-text" style={{ fontSize: size * 0.64, lineHeight: 1 }}>
        joutio
      </span>
    </span>
  )
}
