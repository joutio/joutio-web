import { useState } from 'react'
import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { categoryColor } from '../lib/tokens'
import type { CategoryCode } from '../tokens.generated'

export interface TopicVisualProps {
  category: CategoryCode
  /** Pictogramme carré du sujet : premier choix, comme `TopicTile`. */
  pictogram?: string
  /** Vignette : second choix. Absentes ou en échec : pastille de l'univers. */
  image?: string
  className?: string
  children?: React.ReactNode
}

/**
 * Visuel 44 px d'un sujet dans une ligne (`TopicRow`, `MatchRow`), même visuel que `TopicTile` : la couleur d'univers
 * en retrait d'un pixel, visible à travers un pictogramme détouré, puis l'image, seule à toucher le bord ; sans
 * image, la couleur et l'icône de l'univers. `children` : pastille posée sur le coin.
 */
export function TopicVisual({ category, pictogram, image, className, children }: TopicVisualProps) {
  const [failed, setFailed] = useState<readonly string[]>([])
  const source = [pictogram, image].find((url): url is string => Boolean(url) && !failed.includes(url as string))
  return (
    <span className={cn('relative grid size-11 flex-none place-items-center rounded-jo-md text-jo-on-accent', className)}>
      <span
        aria-hidden
        className={cn('absolute', source ? 'inset-px rounded-[calc(var(--jo-radius-md)-1px)]' : 'inset-0 rounded-jo-md')}
        style={{ backgroundColor: categoryColor(category) }}
      />
      {source ? (
        <img key={source} src={source} alt="" className="absolute inset-0 size-full rounded-jo-md object-cover" onError={() => setFailed((list) => [...list, source])} />
      ) : (
        <CategoryIcon category={category} size={22} weight="fill" className="relative opacity-80" />
      )}
      {children}
    </span>
  )
}
