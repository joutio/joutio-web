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
 * Comme `TopicCard`, le visuel est peint par **un seul élément** : l'image en fond de l'élément arrondi, la couleur de
 * catégorie seulement en repli. Une couleur posée derrière une image enfant découpée par l'arrondi transparaît dans
 * l'anticrénelage du bord et dessine un liseré aux coins dès que l'affichage est zoomé. L'image cachée ne sert qu'à
 * détecter l'échec du chargement.
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
      <span
        className="grid size-[var(--jo-space-11)] place-items-center rounded-jo-md bg-cover bg-center bg-no-repeat text-jo-on-accent"
        style={source ? { backgroundImage: `url("${source}")` } : { backgroundColor: categoryColor(category) }}
      >
        {source ? (
          <img key={source} src={source} alt="" hidden onError={() => setFailed((list) => [...list, source])} />
        ) : <CategoryIcon category={category} size={28} weight="fill" />}
      </span>
      <span className="jo-type-callout line-clamp-2 min-h-[calc(var(--jo-type-callout-line-height)*2)] w-full break-words text-center">{title}</span>
    </button>
  )
}
