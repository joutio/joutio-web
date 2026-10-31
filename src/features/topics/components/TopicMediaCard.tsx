import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryLabel, categoryTextColor } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics/domain/topic"
import { useTopicName } from "@/features/shell"

/** Format d'une affiche d'accueil : portrait du Top 10 ou paysage des autres sections. */
export type TopicMediaFormat = "poster" | "landscape"

/**
 * Affiche de sujet de l'Accueil : visuel plein cadre, **pied de carte intégré** (titre +
 * catégorie sur la surface `bg-card`) et filet de 1 px, à plat dans les deux thèmes. Le format
 * `poster` (Top 10) est une carte **5:8 à toutes les tailles** ; `landscape` reste une carte
 * 16:9. Le rang optionnel est un chiffre Geist Mono posé derrière l'affiche, sur une gouttière
 * de 42 px.
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
        <span
          aria-hidden
          data-slot="topic-rank"
          data-rank={rankValue}
          className={cn(
            "pointer-events-none absolute top-3 -left-[42px] z-0 w-[40px] text-right font-mono leading-none font-semibold text-muted-foreground select-none",
            rankValue === 10 ? "text-4xl tracking-tighter" : "type-display"
          )}
        >
          {rankValue}
        </span>
      )}
      <button
        type="button"
        data-slot="topic-card"
        data-format={format}
        aria-label={rankLabel ? `${rankLabel} — ${title}` : title}
        onClick={() => onOpen(topic.topicId)}
        className={cn(
          "group relative z-10 block w-full overflow-hidden rounded-md border border-border bg-card text-left shadow-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
          isPoster && "flex aspect-[5/8] flex-col"
        )}
      >
        <span
          data-slot="topic-card-media"
          className={cn(
            "relative block overflow-hidden rounded-t-[calc(var(--radius-md)-1px)] bg-muted",
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
          <span className="block truncate text-sm leading-5 font-semibold text-foreground">
            {title}
          </span>
          {category && (
            <span
              data-slot="topic-card-category"
              className="block truncate text-xs leading-4 font-semibold"
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
