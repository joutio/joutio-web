import { useTranslation } from "react-i18next"
import { CheckIcon, SparkleIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { getSessionUserId } from "@/features/auth"
import { useTopicOverview } from "@/features/topic-detail"
import { useTopicName } from "@/features/shell"
import {
  BADGE_TIERS,
  titleLabel,
  topicTitleFor,
  type BadgeTier,
} from "../domain/progression"
import type { Achievement } from "../domain/achievement"
import { useAchievementStore } from "../stores/useAchievementStore"
import { useEquipTitle } from "../hooks/useEquipTitle"
import type { TranslationKey } from "@/lib/i18n/types"
import { BadgeMedallion } from "./BadgeMedallion"
import { TitleRibbon } from "./TitleRibbon"
import {
  badgeLabelKey,
  masteryTierKeyOf,
  METRIC_ACTION_KEYS,
  ONE_SHOT_CONDITION_KEYS,
  tierKeyOf,
} from "./labels"

/** Palier suivant d'une échelle, déduit du code du badge (`DUELIST_ARGENT` → `DUELIST_OR`). */
function nextTierOf(
  code: string | null | undefined,
  tier: BadgeTier | null | undefined
) {
  if (!code || !tier) return null
  const suffix = `_${tier}`
  if (!code.endsWith(suffix)) return null
  const index = BADGE_TIERS.indexOf(tier)
  const next = BADGE_TIERS[index + 1]
  return next
    ? { tier: next, code: `${code.slice(0, -suffix.length)}_${next}` }
    : null
}

/**
 * **Célébration d'un déblocage** (à l'image de la maquette « ACHIEVEMENT ») : médaille du badge
 * ou du titre, **aperçu du ruban** pour un titre, nom, phrase explicative et actions. Affichée
 * par-dessus la page courante — jamais sur un écran
 * immersif (la file attend la sortie, par exemple l'écran de résultat). Un déblocage à la fois,
 * le compteur indique ceux qui suivent.
 */
export function AchievementCelebration({
  achievement,
}: {
  achievement: Achievement
}) {
  const { t, i18n } = useTranslation()
  const dismiss = useAchievementStore((state) => state.dismiss)
  const remaining = useAchievementStore((state) => state.queue.length)
  const userId = getSessionUserId() ?? ""
  const equipTitle = useEquipTitle(userId)

  const topicQuery = useTopicOverview(
    achievement.kind === "TITLE" ? (achievement.topicId ?? "") : ""
  )
  const resolveName = useTopicName()

  const titleTier = achievement.tier ?? "FER"
  const titleRank = titleTier
  const rankLabel = t(masteryTierKeyOf(titleTier))

  const titleKey =
    achievement.kind === "TITLE" && achievement.topicId && achievement.tier
      ? `${achievement.topicId}:${achievement.tier}`
      : null

  // Aperçu du titre **tel qu'il sera porté** : même libellé que le profil — titre thématique du
  // sujet s'il existe, sinon « Palier · Sujet ». Le sujet arrive avec la vue de la fiche (déjà
  // chargée pour le texte de la popup) ; sans lui, le ruban reste lisible avec le palier seul.
  const topic = topicQuery.data?.topic
  const titlePreview =
    achievement.kind === "TITLE"
      ? (topicTitleFor(topicQuery.data?.titles, titleTier, i18n.language) ??
        titleLabel(rankLabel, topic ? resolveName(topic.names) : null))
      : null

  // Libellé : traduction connue du catalogue, sinon libellé renvoyé par le serveur.
  const badgeKey = badgeLabelKey(achievement.code ?? "")
  const badgeLabel = badgeKey
    ? t(badgeKey)
    : (achievement.label ?? t("progression.achievement.badgeFallback"))

  // Objectif qui a permis l'acquisition (le seuil du palier, jamais le restant) : la phrase
  // dédiée d'un exploit prime sur la phrase générique de sa métrique.
  const metricKey = achievement.metric
    ? METRIC_ACTION_KEYS[achievement.metric]
    : undefined
  const objective =
    achievement.kind === "BADGE" &&
    achievement.target !== null &&
    achievement.target !== undefined &&
    metricKey
      ? ONE_SHOT_CONDITION_KEYS[achievement.code ?? ""]
        ? t(ONE_SHOT_CONDITION_KEYS[achievement.code ?? ""])
        : t(metricKey, { count: achievement.target })
      : null

  const next =
    achievement.kind === "BADGE"
      ? nextTierOf(achievement.code, achievement.tier)
      : null
  const nextKey =
    next && badgeKey
      ? (badgeKey.replace(/_[A-Z]+$/, `_${next.tier}`) as TranslationKey)
      : undefined
  const nextLabel = nextKey ? t(nextKey) : null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("progression.achievement.heading")}
    >
      <div className="qu-pop flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border bg-background p-5 text-center shadow-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          {t("progression.achievement.heading")}
        </p>

        {achievement.kind === "BADGE" &&
          achievement.family &&
          achievement.tier && (
            <BadgeMedallion
              family={achievement.family}
              tier={achievement.tier}
              code={achievement.code ?? undefined}
              className="w-32"
            />
          )}
        {achievement.kind === "TITLE" && (
          <TitleRibbon
            label={titlePreview ?? rankLabel}
            rank={titleRank}
            className="w-full max-w-none"
          />
        )}
        {achievement.kind !== "TITLE" && (
          <h2 className="font-heading text-xl font-bold">
            {achievement.kind === "BADGE" && badgeLabel}
          </h2>
        )}

        {achievement.kind === "BADGE" && objective && (
          <p className="flex max-w-[36ch] items-start justify-center gap-1.5 text-sm leading-relaxed">
            <CheckIcon
              className="mt-0.5 size-4 shrink-0 text-success-600"
              aria-hidden
            />
            <span>{t("progression.achievement.objective", { objective })}</span>
          </p>
        )}

        <p className="text-sm leading-snug text-muted-foreground">
          {achievement.kind === "BADGE" &&
            t("progression.achievement.badgeBody", {
              tier: t(tierKeyOf(achievement.tier ?? "BRONZE")),
              next: next
                ? t("progression.achievement.nextTier", {
                    tier: t(tierKeyOf(next.tier)),
                    name: nextLabel ?? "",
                  })
                : t("progression.achievement.maxTier"),
            })}
          {achievement.kind === "TITLE" &&
            t("progression.achievement.titleBody", {
              topic: resolveName(
                topicQuery.data?.topic.names,
                t("progression.achievement.topicFallback")
              ),
            })}
        </p>

        {achievement.kind === "TITLE" && titleKey && (
          <Button
            className="w-full"
            disabled={equipTitle.isPending}
            onClick={() =>
              equipTitle.mutate(titleKey, { onSuccess: () => dismiss() })
            }
          >
            <SparkleIcon /> {t("progression.achievement.equipTitle")}
          </Button>
        )}

        <div className="flex w-full flex-col gap-2">
          <Button variant="ghost" className="w-full" onClick={dismiss}>
            {achievement.kind === "TITLE"
              ? t("progression.achievement.later")
              : t("progression.achievement.close")}
          </Button>
        </div>

        {remaining > 1 && (
          <p className="text-2xs text-muted-foreground">
            {t("progression.achievement.queue", {
              position: 1,
              total: remaining,
            })}
          </p>
        )}
      </div>
    </div>
  )
}
