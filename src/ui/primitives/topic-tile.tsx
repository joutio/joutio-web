import { useState, type ButtonHTMLAttributes } from 'react'
import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { categoryColor } from '../lib/tokens'
import type { CategoryCode } from '../tokens.generated'

export type TopicTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string
  category: CategoryCode
  /** Pictogramme carré du sujet : premier choix. */
  pictogram?: string
  /** Bannière du sujet (celle de `TopicCard`), recadrée au carré : second choix. */
  image?: string
}

/**
 * Sujet compact : visuel carré, puis deux lignes réservées au titre. Repli du visuel : pictogramme, sinon bannière
 * recadrée au carré, sinon couleur et icône de la catégorie (`TopicCard` n'a que bannière puis catégorie). Une source
 * qui échoue passe à la suivante.
 *
 * Deux couches dans un cadre arrondi sans fond (2026-11-12) : la couleur de catégorie, **en retrait d'un pixel** avec
 * un rayon réduit d'autant, puis l'image, seule à toucher le bord. La couleur se voit à travers la transparence d'un
 * pictogramme détouré, mais jamais dans l'anticrénelage de l'arrondi : posée jusqu'au bord, elle y dessinait un liseré
 * aux coins, visible en thème sombre. Sans image, la couleur remplit le cadre. L'image cachée ne sert qu'à détecter
 * l'échec du chargement.
 */
export function TopicTile({ title, category, pictogram, image, className, type = 'button', ...props }: TopicTileProps) {
  const [failed, setFailed] = useState<readonly string[]>([])
  const source = [pictogram, image].find((url): url is string => Boolean(url) && !failed.includes(url as string))
  return (
    <button
      type={type}
      aria-label={title}
      className={cn('jo-transition jo-focus grid min-w-0 w-full cursor-pointer justify-items-center gap-[var(--jo-space-3)] rounded-jo-md bg-transparent text-jo-text jo-pressed:scale-[.98] disabled:cursor-default disabled:opacity-40', className)}
      {...props}
    >
      <span className="relative grid size-[var(--jo-space-11)] flex-none place-items-center rounded-jo-md text-jo-on-accent">
        <span
          aria-hidden
          className={cn('absolute', source ? 'inset-px rounded-[calc(var(--jo-radius-md)-1px)]' : 'inset-0 rounded-jo-md')}
          style={{ backgroundColor: categoryColor(category) }}
        />
        {source ? (
          <>
            <span aria-hidden className="absolute inset-0 rounded-jo-md bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url("${source}")` }} />
            <img key={source} src={source} alt="" hidden onError={() => setFailed((list) => [...list, source])} />
          </>
        ) : (
          <CategoryIcon category={category} size={28} weight="fill" className="relative" />
        )}
      </span>
      <span className="jo-type-callout line-clamp-2 min-h-[calc(var(--jo-type-callout-line-height)*2)] w-full break-words text-center">{title}</span>
    </button>
  )
}
