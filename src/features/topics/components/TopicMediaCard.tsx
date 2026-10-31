import { useTranslation } from "react-i18next"
import { cn } from "cn"
import rank1Url from "@/assets/top-10/rank-1.svg"
import rank2Url from "@/assets/top-10/rank-2.svg"
import rank3Url from "@/assets/top-10/rank-3.svg"
import rank4Url from "@/assets/top-10/rank-4.svg"
import rank5Url from "@/assets/top-10/rank-5.svg"
import rank6Url from "@/assets/top-10/rank-6.svg"
import rank7Url from "@/assets/top-10/rank-7.svg"
import rank8Url from "@/assets/top-10/rank-8.svg"
import rank9Url from "@/assets/top-10/rank-9.svg"
import rank10Url from "@/assets/top-10/rank-10.svg"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryLabel, categoryTextColor } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

/** Format d'une affiche d'accueil : portrait du Top 10 ou paysage des autres sections. */
export type TopicMediaFormat = "poster" | "landscape"

/** Chiffres officiels FranceTV : largeurs intrinsèques variables, hauteur commune (~76 px). */
const RANK_IMAGES: readonly string[] = [
  rank1Url,
  rank2Url,
  rank3Url,
  rank4Url,
  rank5Url,
  rank6Url,
  rank7Url,
  rank8Url,
  rank9Url,
  rank10Url,
]

/**
 * Affiche de sujet de l'Accueil (style FranceTV) : visuel plein cadre, **pied de carte intégré**
 * (titre + catégorie sur la surface `bg-card` de la carte) et bordure de surface. **À plat en
 * clair** (bordure seule), ombre profonde en sombre. Le format
 * `poster` (Top 10) est une carte **5:8 à toutes les tailles** (affiche +
 * pied) ; `landscape` reste une carte 16:9 avec pied intégré pour les autres sections.
 * Le rang optionnel est le chiffre SVG officiel FranceTV, placé derrière l'affiche portrait sur
 * une gouttière de 42 px. Chaque chiffre garde sa largeur intrinsèque : la carte le chevauche
 * donc exactement comme la référence, avec la même hauteur pour 1 → 10. En clair, `.qu-rank`
 * inverse le chiffre et lui donne un liseré sombre net ; en sombre, le SVG garde son rendu.
 */
export function TopicMediaCard({
  topic,
  onOpen,
  rank,
  format = "landscape",
  priority = false,
  className,
}: {
  topic: TopicCard
  onOpen: (topicId: string) => void
  /** Rang 1-based du classement (Top 10) — affiché uniquement en format `poster`. */
  rank?: number
  /** `poster` : carte 5:8 du Top 10 ; `landscape` : carte 16:9 des autres rails. */
  format?: TopicMediaFormat
  /** Visuel au-dessus de la ligne de flottaison (`eager` + priorité haute). */
  priority?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const title = resolveName(topic.names)
  const category = topic.category
    ? categoryLabel(topic.category, topic.categoryLabel ?? undefined)
    : null
  const categoryColorValue = topic.category
    ? categoryTextColor(topic.category)
    : undefined
  const rankValue = format === "poster" ? rank : undefined
  const rankLabel =
    rankValue === undefined
      ? null
      : t("topics.carousel.rank", { rank: rankValue })
  const visualUrl =
    format === "landscape"
      ? (topic.bannerUrl ?? topic.imageUrl)
      : topic.imageUrl
  const visualTopic = { ...topic, imageUrl: visualUrl }
  const isPoster = format === "poster"

  return (
    <div className={cn("relative", className)}>
      {rankValue !== undefined && (
        <img
          src={RANK_IMAGES[rankValue - 1]}
          alt=""
          aria-hidden
          data-slot="topic-rank"
          data-rank={rankValue}
          draggable={false}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "pointer-events-none absolute top-4 z-0 h-auto w-auto qu-rank select-none",
            rankValue === 1 ? "-left-[25.346px]" : "-left-[42px]"
          )}
        />
      )}
      <button
        type="button"
        data-slot="topic-card"
        data-format={format}
        aria-label={rankLabel ? `${rankLabel} — ${title}` : title}
        onClick={() => onOpen(topic.topicId)}
        className={cn(
          "group relative z-10 block w-full overflow-hidden rounded-lg border border-border bg-card text-left shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
          isPoster && "flex aspect-[5/8] flex-col"
        )}
      >
        <span
          data-slot="topic-card-media"
          className={cn(
            "relative block overflow-hidden rounded-t-[calc(var(--radius-lg)-1px)] bg-muted",
            isPoster ? "min-h-0 flex-1" : "aspect-video"
          )}
        >
          <TopicIcon
            topic={visualTopic}
            fill
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        </span>
        <span
          data-slot="topic-card-footer"
          className={cn(
            "flex h-16 shrink-0 flex-col bg-card px-3 py-2.5",
            category ? "justify-between" : "justify-center"
          )}
        >
          <span className="block truncate font-heading text-base leading-tight font-bold text-foreground">
            {title}
          </span>
          {category && (
            <span
              data-slot="topic-card-category"
              className="block truncate text-2xs font-semibold tracking-wide uppercase"
              style={{ color: categoryColorValue }}
            >
              {category}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
