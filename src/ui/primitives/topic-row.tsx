import { CaretRightIcon, CircleIcon, RadioButtonIcon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { TopicVisual } from './topic-visual'
import type { CategoryCode } from '../tokens.generated'
import { OfficialBadge } from '../brand/premium-badge'
import { useT } from '@/lib/i18n'
import { categoryKey } from '@joutio/client/core/i18n'

export type TopicRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Sujet éditorial de Joutio (`OfficialBadge` après le nom) ; obligatoire : chaque sujet affiché dit s'il l'est. */
  official: boolean
  title: string
  category: CategoryCode
  /** Pictogramme carré du sujet : premier choix, comme `TopicTile`. */
  pictogram?: string
  /** Vignette : second choix. Absentes ou en échec : pastille de l'univers. */
  image?: string
  /** Sous le titre. Par défaut, le nom de l'univers. */
  sub?: string
  /** `radio` : choix unique, à placer dans un `radiogroup`. */
  control?: 'chevron' | 'radio'
  /** Sélection, avec `radio`. */
  on?: boolean
  /** Dernière ligne de la liste : sans filet. */
  last?: boolean
  /** Actions en attente : pastille `accent` (`9+` au-delà de 9) ; la sous-ligne ne change pas. */
  badge?: number
}

/** Sujet à choisir dans une liste : visuel, nom, univers, puis chevron ou radio. */
export function TopicRow({ title, official, category, pictogram, image, sub: ownSub, control = 'chevron', on = false, last = false, badge, className, type = 'button', ...props }: TopicRowProps) {
  const t = useT()
  const sub = ownSub ?? t(categoryKey(category))
  const radio = control === 'radio'
  const SelectIcon = on ? RadioButtonIcon : CircleIcon
  return (
    <button
      type={type}
      role={radio ? 'radio' : undefined}
      aria-checked={radio ? on : undefined}
      className={cn(
        'jo-transition jo-focus-inset flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left jo-pressed:bg-jo-hover',
        !last && 'border-b border-jo-border',
        className,
      )}
      {...props}
    >
      <TopicVisual category={category} pictogram={pictogram} image={image} />
      <span className="grid min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1">
          <strong className="jo-type-headline truncate">{title}</strong>
          {official && <OfficialBadge size={16} />}
        </span>
        <span className="jo-type-caption truncate text-jo-muted">{sub}</span>
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="jo-type-caption grid h-5 min-w-5 flex-none place-items-center rounded-jo-full bg-jo-accent px-1.5 font-semibold text-jo-on-accent">
          <span aria-hidden>{badge > 9 ? '9+' : badge}</span>
          <span className="sr-only">{t('ds.toHandle', { count: badge })}</span>
        </span>
      )}
      {radio ? (
        <SelectIcon size={24} weight={on ? 'fill' : 'regular'} className={cn('flex-none', on ? 'text-jo-accent-ink' : 'text-jo-muted')} aria-hidden />
      ) : (
        <CaretRightIcon size={20} className="flex-none text-jo-muted" aria-hidden />
      )}
    </button>
  )
}
