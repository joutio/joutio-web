import { Bot, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTopicName } from "@/features/shell"
import { TopicIcon } from "@/shared/components/topic-icon"
import { TOKEN } from "@/shared/theme/tokens"
import {
  categoryColor,
  categoryIcon,
  categoryLabel,
} from "@/shared/utils/categories"
import type { TopicCard } from "@/features/topics"

interface OnboardingPreviewProps {
  step: 0 | 1
  interests: string[]
  topic?: TopicCard | null
}

/**
 * Panneau d'aperçu desktop : à l'étape 1, un mini « Pour toi » se remplit avec les univers
 * choisis ; à l'étape 2, il montre le duel d'entraînement proposé. Décoratif (`aria-hidden`
 * côté shell), il matérialise l'effet du profil sur l'accueil.
 */
export function OnboardingPreview({
  step,
  interests,
  topic,
}: OnboardingPreviewProps) {
  return (
    <div
      className="relative overflow-hidden rounded-card border border-[var(--duel-surface)] p-6"
      style={{ backgroundColor: TOKEN.duelBg, color: TOKEN.duelSurface }}
    >
      <div className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-[var(--duel-gauge)]/15 blur-3xl" />
      {step === 0 ? (
        <ThemesPreview interests={interests} />
      ) : (
        <DuelPreview topic={topic} />
      )}
    </div>
  )
}

function ThemesPreview({ interests }: { interests: string[] }) {
  const { t } = useTranslation()
  return (
    <div className="relative flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Sparkles
          className="size-4"
          style={{ color: TOKEN.gauge }}
          aria-hidden
        />
        <span className="text-xs font-semibold tracking-wide uppercase">
          {t("home.onboarding.previewForYou")}
        </span>
      </div>
      <div>
        <p className="font-heading text-lg font-bold">
          {t("home.onboarding.previewHomeTitle")}
        </p>
        <p className="mt-1 text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
          {interests.length > 0
            ? t("home.onboarding.previewHomeFilled")
            : t("home.onboarding.previewHomeEmpty")}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, index) => {
          const code = interests[index]
          if (!code) {
            return (
              <div
                key={`empty-${index}`}
                className="flex aspect-[4/5] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.03]"
              >
                <span className="text-lg text-white/20">+</span>
              </div>
            )
          }
          const Icon = categoryIcon(code)
          return (
            <div
              key={code}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-2 text-center"
              style={{
                background: `color-mix(in oklab, ${categoryColor(code)} 22%, transparent)`,
              }}
            >
              <Icon
                className="size-6"
                style={{ color: categoryColor(code) }}
                aria-hidden
              />
              <span className="line-clamp-2 text-2xs font-semibold">
                {categoryLabel(code)}
              </span>
            </div>
          )
        })}
      </div>
      <div
        className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs"
        style={{ color: TOKEN.duelSurfaceMuted }}
      >
        {t("home.onboarding.previewNote")}
      </div>
    </div>
  )
}

function DuelPreview({ topic }: { topic?: TopicCard | null }) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  return (
    <div className="relative flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Bot
          className="size-4"
          style={{ color: TOKEN.correctAccent }}
          aria-hidden
        />
        <span className="text-xs font-semibold tracking-wide uppercase">
          {t("home.onboarding.previewDuel")}
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        {topic ? (
          <>
            <TopicIcon
              topic={{ ...topic, imageUrl: topic.imageUrl ?? topic.bannerUrl }}
              size={56}
            />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-bold">
                {resolveName(topic.names)}
              </p>
              <p
                className="mt-0.5 text-xs"
                style={{ color: TOKEN.duelSurfaceMuted }}
              >
                {categoryLabel(
                  topic.category ?? "",
                  topic.categoryLabel ?? undefined
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="h-14 w-full animate-pulse rounded-xl bg-white/10" />
        )}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-white/10">
            <Bot className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">
              {t("home.onboarding.previewBot")}
            </p>
            <p className="text-xs" style={{ color: TOKEN.duelSurfaceMuted }}>
              {t("home.onboarding.previewTraining")}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-2xs font-semibold">
          {t("home.onboarding.previewNoElo")}
        </span>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: 7 }).map((_, index) => (
          <span
            key={index}
            className="size-1.5 rounded-full bg-white/25"
            style={
              index === 0 ? { backgroundColor: TOKEN.correctAccent } : undefined
            }
          />
        ))}
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: TOKEN.duelSurfaceMuted }}
      >
        {t("home.onboarding.previewDuelNote")}
      </p>
    </div>
  )
}
