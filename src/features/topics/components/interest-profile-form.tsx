import { CheckIcon, CircleNotchIcon, StarIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  categoryColor,
  categoryIcon,
  categoryLabel,
  categoryTextColor,
} from "@/shared/utils/categories"
import { useTopicCategories, useTopicFacets } from "../hooks/useTopics"
import type { TopicCategory } from "../domain/topic"

interface InterestProfileFormProps {
  /** Codes ordonnés : le premier est l'univers principal. */
  value: string[]
  onChange: (next: string[]) => void
  min?: number
  max?: number
  disabled?: boolean
}

/**
 * Sélecteur de centres d'intérêt partagé par l'onboarding et les Réglages : tuiles d'univers
 * (sans compteur de sujets), sélection de 0-3 codes et désignation de l'univers principal
 * (premier de la liste). Les catégories sans sujet publié sont masquées via les facettes.
 */
export function InterestProfileForm({
  value,
  onChange,
  min = 0,
  max = 3,
  disabled = false,
}: InterestProfileFormProps) {
  const { t } = useTranslation()
  const categoriesQuery = useTopicCategories()
  const facetsQuery = useTopicFacets({})

  const counts = new Map(
    (facetsQuery.data?.categories ?? []).map((facet) => [
      facet.category,
      facet.count,
    ])
  )
  const categories: TopicCategory[] = (categoriesQuery.data ?? []).filter(
    (category) => {
      const count = counts.get(category.category)
      return (
        count === undefined || count > 0 || value.includes(category.category)
      )
    }
  )
  const loading = categoriesQuery.isLoading
  const error = categoriesQuery.isError
  const atLimit = value.length >= max
  const primary = value[0]

  function toggle(code: string) {
    if (disabled) return
    if (value.includes(code)) {
      onChange(value.filter((item) => item !== code))
      return
    }
    if (atLimit) return
    onChange([...value, code])
  }

  function promote(code: string) {
    if (disabled || code === primary) return
    onChange([code, ...value.filter((item) => item !== code)])
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 tablet-up:grid-cols-3" aria-busy>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="min-h-24 animate-pulse rounded-2xl border border-border bg-muted/40"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-destructive">
          {t("home.onboarding.categoriesError")}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void categoriesQuery.refetch()
            void facetsQuery.refetch()
          }}
        >
          {t("home.onboarding.retry")}
        </Button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("home.onboarding.noCategories")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className="text-xs font-semibold text-muted-foreground"
          aria-live="polite"
        >
          {t("home.onboarding.selectedUniverses", { count: value.length })}
        </span>
        <span className="text-xs text-muted-foreground">
          {value.length === 0
            ? min > 0
              ? t("home.onboarding.minimumUniverse", { count: min })
              : t("home.onboarding.chooseUpTo", { count: max })
            : atLimit
              ? t("home.onboarding.maximumUniverses", { count: max })
              : t("home.onboarding.chooseUpTo", { count: max })}
        </span>
      </div>

      <div
        className="grid grid-cols-2 gap-2 tablet-up:grid-cols-3"
        role="group"
        aria-label={t("home.onboarding.interestsTitle")}
      >
        {categories.map((category) => {
          const selected = value.includes(category.category)
          const Icon = categoryIcon(category.category)
          const blocked = disabled || (!selected && atLimit)
          return (
            <button
              key={category.category}
              type="button"
              aria-pressed={selected}
              disabled={blocked}
              onClick={() => toggle(category.category)}
              className={
                selected
                  ? "relative flex min-h-24 flex-col items-start justify-between gap-3 rounded-2xl border border-primary bg-primary/5 p-4 text-left ring-1 ring-primary"
                  : "relative flex min-h-24 flex-col items-start justify-between gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-45"
              }
            >
              <span
                className="grid size-10 place-items-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in oklab, ${categoryColor(category.category)} 16%, transparent)`,
                  color: categoryTextColor(category.category),
                }}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="font-heading text-sm font-semibold">
                {categoryLabel(category.category, category.label)}
              </span>
              {selected && (
                <span className="absolute top-3 right-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CheckIcon className="size-3" aria-hidden />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {value.length > 1 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2">
            <StarIcon className="size-4 text-accent-ink" aria-hidden />
            <h3 className="text-sm font-semibold">
              {t("home.onboarding.primaryTitle")}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("home.onboarding.primarySubtitle")}
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t("home.onboarding.primaryTitle")}
          >
            {value.map((code) => {
              const category = categories.find((item) => item.category === code)
              const Icon = categoryIcon(code)
              const isPrimary = code === primary
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={isPrimary}
                  disabled={disabled}
                  onClick={() => promote(code)}
                  className={
                    isPrimary
                      ? "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-semibold text-accent-ink"
                      : "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted/50 disabled:opacity-50"
                  }
                >
                  <Icon className="size-3.5" aria-hidden />
                  {categoryLabel(code, category?.label)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {categoriesQuery.isFetching && (
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <CircleNotchIcon className="size-3.5 animate-spin" aria-hidden />
          {t("common.app.loading")}
        </span>
      )}
    </div>
  )
}
