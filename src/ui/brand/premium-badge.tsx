import { useId } from 'react'
import { cn } from '../lib/cn'
import { useT } from '@/lib/i18n'

/** Sceau certifié à 12 festons (24 × 24), centré. */
const SEAL = (() => {
  const points = 24
  const path: string[] = []
  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2 - Math.PI / 2
    const radius = index % 2 === 0 ? 11.4 : 9.4
    const x = (12 + Math.cos(angle) * radius).toFixed(2)
    const y = (12 + Math.sin(angle) * radius).toFixed(2)
    path.push(`${index === 0 ? 'M' : 'L'}${x} ${y}`)
  }
  return `${path.join('')}Z`
})()

export type PremiumBadgeProps = {
  /** Côté en px, calé sur la ligne du pseudonyme : 18 avec `headline`, 22 avec `title2`, 16 au-dessous. */
  size?: number
  className?: string
}

type SealProps = PremiumBadgeProps & { label: string; fill: string; ink: string }

/** Sceau certifié, coche et reflet : base commune de `PremiumBadge` et `OfficialBadge`. */
function SealBadge({ size = 18, className, label, fill, ink }: SealProps) {
  const id = useId()
  return (
    <svg role="img" aria-label={label} viewBox="0 0 24 24" width={size} height={size} className={cn('inline-block flex-none', className)}>
      <title>{label}</title>
      <defs>
        <clipPath id={`${id}-seal`}>
          <path d={SEAL} />
        </clipPath>
        <linearGradient id={`${id}-shine`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={fill} strokeLinejoin="round" stroke={fill} strokeWidth="1.2" />
      <g clipPath={`url(#${id}-seal)`}>
        <g transform="rotate(20 12 12)">
          <rect className="jo-premium-shine" x="-10" y="-6" width="8" height="36" fill={`url(#${id}-shine)`} />
        </g>
      </g>
      <path d="m7.6 12.3 3 3 5.8-6.3" fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * Marque des joueurs **Premium**, à droite du pseudonyme partout où un joueur est nommé (`marque.md` § PremiumBadge) :
 * sceau certifié `accent`, coche `onAccent`, reflet blanc qui le balaie toutes les 2 s environ (immobile sous mouvement
 * réduit). Annoncé « Premium ».
 */
export function PremiumBadge(props: PremiumBadgeProps) {
  const t = useT()
  return <SealBadge {...props} label={t('pending.premium')} fill="var(--jo-accent)" ink="var(--jo-on-accent)" />
}

/**
 * Marque des sujets **officiels** (éditoriaux de Joutio), à droite du nom du sujet (`marque.md` § OfficialBadge) : même
 * sceau que Premium, en `official` (bleu) avec coche `onOfficial`. Annoncé « Officiel » (`label` traduit par l'app).
 */
export function OfficialBadge({ label, ...props }: PremiumBadgeProps & { label?: string }) {
  const t = useT()
  return <SealBadge {...props} label={label ?? t('ds.official')} fill="var(--jo-official)" ink="var(--jo-on-official)" />
}

