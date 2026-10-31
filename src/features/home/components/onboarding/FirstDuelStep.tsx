import { Bot, Check, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useTopicName } from "@/features/shell"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryColor, categoryLabel } from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics"

interface FirstDuelStepProps {
  interests: string[]
  topics: TopicCard[]
  selectedTopicId: string | null
  onSelect: (topicId: string) => void
  loading: boolean
  error: boolean
  onRetry: () => void
}

/**
 * Étape 2 : thème recommandé à partir des univers choisis (premier = principal), alternatives
 * issues des autres univers, puis duel d'entraînement contre un bot. Aucun choix de mode.
 */
export function FirstDuelStep({
  interests,
  topics,
  selectedTopicId,
  onSelect,
  loading,
  error,
  onRetry,
}: FirstDuelStepProps) {
  const { t } = useTranslation()
  const resolveName = useTopicName()

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-56 animate-pulse rounded-card border border-border bg-muted/40" />
        <div className="grid gap-3 tablet-up:grid-cols-2">
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-muted/40" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-card p-8 text-center">
        <p className="text-sm text-destructive">
          {t("home.onboarding.recommendationsError")}
        </p>
        <Button variant="outline" onClick={onRetry}>
          {t("home.onboarding.retry")}
        </Button>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-card p-8 text-center">
        <p className="font-heading text-base font-semibold">
          {t("home.onboarding.noRecommendationsTitle")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("home.onboarding.noRecommendations")}
        </p>
      </div>
    )
  }

  const primary = topics[0]
  const alternatives = topics.slice(1, 3)
  const selected =
    topics.find((topic) => topic.topicId === selectedTopicId) ?? primary
  const primaryInterest = interests[0]
  const cover = primary.imageUrl ?? primary.bannerUrl
  const coverColor = primary.color ?? categoryColor(primary.category ?? "")

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-accent-ink" aria-hidden />
          <span className="text-xs font-semibold tracking-wide text-accent-ink uppercase">
            {t("home.onboarding.recommendedForYou")}
          </span>
        </div>

        <button
          type="button"
          aria-pressed={selected.topicId === primary.topicId}
          onClick={() => onSelect(primary.topicId)}
          className={
            selected.topicId === primary.topicId
              ? "overflow-hidden rounded-card border border-primary bg-primary/5 text-left ring-1 ring-primary"
              : "overflow-hidden rounded-card border border-border bg-card text-left transition-colors hover:bg-muted/40"
          }
        >
          <div className="relative aspect-[16/8] overflow-hidden">
            {cover ? (
              <TopicIcon
                topic={{ ...primary, imageUrl: cover }}
                fill
                loading="eager"
                fetchPriority="high"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${coverColor} 0%, color-mix(in oklab, ${coverColor} 62%, black) 100%)`,
                }}
              >
                <div className="absolute -top-10 -right-8 size-44 rounded-full bg-white/15 blur-3xl" />
                <div className="absolute inset-0 grid place-items-center">
                  <TopicIcon topic={primary} size={88} className="shadow-xl" />
                </div>
              </div>
            )}
            {selected.topicId === primary.topicId && (
              <span className="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Check className="size-4" strokeWidth={3} aria-hidden />
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1 p-4">
            <span className="text-xs font-semibold text-muted-foreground">
              {categoryLabel(
                primary.category ?? "",
                primary.categoryLabel ?? undefined
              )}
            </span>
            <span className="font-heading text-lg font-bold">
              {resolveName(primary.names)}
            </span>
            <span className="text-xs text-muted-foreground">
              {selected.topicId === primary.topicId &&
              primary.category === primaryInterest
                ? t("home.onboarding.whyPrimary", {
                    category: categoryLabel(
                      primary.category ?? "",
                      primary.categoryLabel ?? undefined
                    ),
                  })
                : t("home.onboarding.whyInterest")}
            </span>
          </div>
        </button>
      </div>

      {alternatives.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            {t("home.onboarding.alternativesTitle")}
          </h3>
          <div className="grid gap-2 tablet-up:grid-cols-2">
            {alternatives.map((topic) => {
              const isSelected = selected.topicId === topic.topicId
              return (
                <button
                  key={topic.topicId}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(topic.topicId)}
                  className={
                    isSelected
                      ? "flex items-center gap-3 rounded-2xl border border-primary bg-primary/5 p-2.5 text-left ring-1 ring-primary"
                      : "flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/40"
                  }
                >
                  <TopicIcon topic={topic} size={48} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {resolveName(topic.names)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {categoryLabel(
                        topic.category ?? "",
                        topic.categoryLabel ?? undefined
                      )}
                    </span>
                  </span>
                  {isSelected && (
                    <Check
                      className="size-4 shrink-0 text-accent-ink"
                      aria-hidden
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-card border border-border bg-muted/30 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background">
          <Bot className="size-5 text-accent-ink" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-heading text-sm font-bold">
            {t("home.onboarding.botTitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("home.onboarding.botDescription")}
          </p>
        </div>
      </div>
    </div>
  )
}
