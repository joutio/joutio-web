import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card"

import { getSessionUserId } from "@/features/auth"
import { PageContainer, useMe } from "@/features/shell"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { masteryTierKeyOf, useEquipTitle } from "@/features/progression"
import {
  MASTERY_TIERS,
  MASTERY_TIER_THRESHOLDS,
  TIER_COLORS,
  TITLE_CARD_ACCENT,
  titleProgressPercent,
  topicTitleFor,
  type MasteryTier,
} from "@/features/progression/domain/progression"
import type { TopicCard } from "@/features/topics/domain/topic"
import { cn } from "cn"

interface TopicTitlesTabProps {
  topic: TopicCard | undefined
  /** Titres thématiques par langue puis palier (`TopicOverviewView.titles`). */
  titles: Record<string, Record<string, string>> | null | undefined
  /** Maîtrise du sujet pour le joueur courant (`TopicOverviewView.myProgress`). */
  progress: {
    xp: number
    /** Parties humaines terminées (abandon inclus) — condition du titre Fer. */
    games: number
    tier: string
    tierProgressPercent: number
    tierRemainingXp: number
    nextTier: string | null
  } | null
  /** Clé du titre porté (`topicId:TIER`), `null` si aucun. */
  equippedKey: string | null
}

/**
 * Onglet **Titres** d'une fiche sujet : les sept paliers de maîtrise, chacun en carte
 * **dépliable** — repliée, elle ne porte que le titre thématique du sujet et sa **pastille
 * d'état** (disque vert à coche blanche pour un palier atteint, rond neutre à cadenas sinon),
 * **aucune info d'XP** ; dépliée, elle affiche d'abord sa **rareté** (« Rareté : Fer ») dans la
 * couleur du palier, puis un palier **verrouillé** porte son critère et la progression chiffrée
 * (`XP / seuil`, pourcentage, barre à la couleur du palier) — **sauf le titre Fer**, dont le
 * déblocage ne dépend pas de l'XP — puis l'action « Utiliser ce titre ». Un palier **atteint**
 * n'affiche que son état et l'action : la marche vers le palier suivant vit dans la jauge de
 * maîtrise du bandeau. Le palier d'entrée (Fer,
 * 0 XP) n'est un titre qu'après une **partie humaine terminée** dans le sujet (abandon inclus ;
 * même règle que `/titles` côté BFF). Une fois Fer acquis, sa carte affiche sa propre condition
 * et non plus la marche vers Bronze.
 */
export function TopicTitlesTab({
  topic,
  titles,
  progress,
  equippedKey,
}: TopicTitlesTabProps) {
  const { t, i18n } = useTranslation()
  const me = useMe()
  const userId = getSessionUserId() ?? ""
  const equipTitle = useEquipTitle(userId)

  if (!topic) {
    return null
  }

  const topicXp = progress?.xp ?? 0
  const humanGames = progress?.games ?? 0
  const hasHumanGame = humanGames > 0
  const currentIndex =
    hasHumanGame && progress
      ? MASTERY_TIERS.indexOf(progress.tier as MasteryTier)
      : -1
  // Le titre Fer (palier d'entrée) n'est débloqué qu'après une partie humaine terminée
  // (abandon inclus) — un duel bot, à 0 XP, ne débloque rien.
  const untouched = !hasHumanGame

  return (
    <PageContainer style={{ paddingTop: 16 }}>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("topic.detail.titles.subtitle")}
      </p>

      <div className="flex flex-col gap-2">
        {MASTERY_TIERS.map((tier, index) => {
          const threshold = MASTERY_TIER_THRESHOLDS[tier]
          const isEntryTitle = index === 0
          const unlocked = hasHumanGame && index <= currentIndex
          const current = index === currentIndex
          const key = `${topic.topicId}:${tier}`
          const equipped = equippedKey === key
          const remaining = Math.max(0, threshold - topicXp)
          const rankColor = TIER_COLORS[tier]
          const topicName =
            i18n.language === "en"
              ? (topic.names.en ?? topic.names.fr ?? null)
              : (topic.names.fr ?? null)
          const label =
            topicTitleFor(titles ?? null, tier, i18n.language) ??
            `${t(masteryTierKeyOf(tier))}${topicName ? ` · ${topicName}` : ""}`

          // Cible de la barre : uniquement les paliers **verrouillés** hors Fer. Un palier atteint
          // n'affiche aucune progression : la marche vers le palier suivant vit dans la jauge de
          // maîtrise du bandeau (le titre Fer se débloque par une partie humaine, pas par l'XP).
          const progressTarget = !unlocked && !isEntryTitle ? threshold : null
          const percent =
            progressTarget !== null
              ? titleProgressPercent(topicXp, progressTarget)
              : null

          const criterion =
            untouched && isEntryTitle
              ? t("topic.detail.titles.playFirst")
              : current && isEntryTitle
                ? t("topic.detail.titles.unlockedByGame")
                : !unlocked
                  ? t("topic.detail.titles.remaining", {
                      xp: remaining.toLocaleString(i18n.language),
                    })
                  : null

          return (
            <ExpandableCard
              key={tier}
              title={label}
              media={
                /* Pastille d'état : disque vert à coche blanche pour un palier **atteint**, rond
                   neutre à cadenas sinon — la progression XP vit dans le panneau déplié des
                   paliers verrouillés. Un point de rang (Fer → Diamant) rappelle la rareté du
                   titre sur la carte repliée. */
                <span className="relative shrink-0">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-full",
                      !unlocked && "text-muted-foreground"
                    )}
                    style={
                      unlocked
                        ? TITLE_CARD_ACCENT.acquiredCheck
                        : { background: "var(--muted)" }
                    }
                    aria-hidden
                  >
                    {unlocked ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      <Lock className="size-4" />
                    )}
                  </span>
                  <span
                    className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card"
                    style={{ background: rankColor.fill }}
                    aria-hidden
                  />
                </span>
              }
              defaultExpanded={current}
              style={
                equipped
                  ? TITLE_CARD_ACCENT.equipped
                  : unlocked
                    ? TITLE_CARD_ACCENT.unlocked
                    : undefined
              }
            >
              <div className="flex flex-col gap-2.5">
                <p
                  className="text-xs font-semibold"
                  style={{ color: rankColor.text }}
                >
                  {t("progression.rarity", {
                    tier: t(masteryTierKeyOf(tier)),
                  })}
                </p>

                {criterion && (
                  <p className="text-sm leading-relaxed">{criterion}</p>
                )}

                {percent !== null && progressTarget !== null && (
                  <div className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3 text-xs font-semibold">
                      <span>
                        {t("topic.detail.titles.xpProgress", {
                          progress: topicXp.toLocaleString(i18n.language),
                          target: progressTarget.toLocaleString(i18n.language),
                        })}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {t("topic.detail.titles.percent", { percent })}
                      </span>
                    </span>
                    <span className="block h-4 overflow-hidden rounded-full bg-foreground/20">
                      <span
                        className="block h-full rounded-full transition-[width] duration-300"
                        style={{
                          width: `${percent}%`,
                          background: rankColor.fill,
                        }}
                      />
                    </span>
                  </div>
                )}

                {unlocked &&
                  (equipped ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
                      <Check className="size-3.5" />
                      {t("progression.titleEquipped")}
                    </span>
                  ) : (
                    <span className="flex flex-col items-start gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success-600">
                        <Check className="size-3.5" />
                        {t("progression.titleUnlocked")}
                      </span>
                      <Button
                        size="sm"
                        disabled={equipTitle.isPending || !me.data}
                        onClick={() =>
                          equipTitle.mutate(key, {
                            onSuccess: () =>
                              showSuccessToast(
                                t("progression.toasts.titleEquipped")
                              ),
                          })
                        }
                      >
                        {t("progression.titleEquip")}
                      </Button>
                    </span>
                  ))}
              </div>
            </ExpandableCard>
          )
        })}
      </div>
    </PageContainer>
  )
}
