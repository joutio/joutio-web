import { useState, type ButtonHTMLAttributes } from 'react'
import { CategoryIcon } from '../brand/category-icon'
import { cn } from '../lib/cn'
import { categoryColor, categoryInk } from '../lib/tokens'
import { tokens, type CategoryCode } from '../tokens.generated'

export type TopicCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  title: string
  category: CategoryCode
  orientation?: 'portrait' | 'landscape'
  image?: string
}

/** Visuel : bannière, sinon couleur et icône de la catégorie (aussi quand la bannière échoue au chargement). */
export function TopicCard({
  title,
  category,
  orientation = 'landscape',
  image,
  className,
  type = 'button',
  ...props
}: TopicCardProps) {
  const portrait = orientation === 'portrait'
  const [failedImage, setFailedImage] = useState<string>()
  const banner = image && failedImage !== image ? image : undefined
  return (
    <button
      type={type}
      className={cn(
        'jo-transition jo-focus flex w-full cursor-pointer flex-col overflow-hidden rounded-jo-md bg-jo-raised text-left jo-pressed:scale-[.99]',
        portrait ? 'aspect-[3/4]' : '',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'grid w-full place-items-center bg-cover bg-center',
          portrait ? 'min-h-0 flex-1' : 'aspect-video',
        )}
        style={{
          backgroundColor: categoryColor(category),
          backgroundImage: banner ? `url("${banner}")` : undefined,
        }}
      >
        {banner && <img key={banner} src={banner} alt="" hidden onError={() => setFailedImage(banner)} />}
        {!banner && (
          <CategoryIcon category={category} size={28} weight="fill" className="text-jo-on-accent opacity-80" />
        )}
      </span>
      <span className="grid min-w-0 gap-0.5 px-3 pt-2 pb-3">
        <span className="jo-type-caption truncate font-semibold" style={{ color: categoryInk(category) }}>
          {tokens.category[category].label}
        </span>
        <span className="jo-type-callout truncate font-semibold">{title}</span>
      </span>
    </button>
  )
}
