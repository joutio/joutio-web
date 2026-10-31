import { useTranslation } from "react-i18next"
import { CheckIcon, GiftIcon, LockIcon } from "@phosphor-icons/react"
import { useNavigate } from "react-router-dom"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/shared/components/empty-state"
import { UserAvatar } from "@/shared/components/user-avatar"
import { useLocale } from "@/lib/i18n/useLocale"
import { badgeLabelKey } from "./labels"
import { LOCKED_SURFACE_CLASS, LOCKED_VISUAL_CLASS } from "./locked-visuals"
import { rewardMetadata, rewardSourceKey } from "./rewards"
import type { Reward } from "../domain/rewards"
import { useRewards } from "../hooks/useRewards"

function formatUnlockedAt(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(value)
  )
}

/**
 * Onglet « Récompenses » : catalogue complet, verrouillées comprises. Les récompenses débloquées
 * viennent de `player_reward` (date + source) ; les verrouillées affichent leur condition.
 */
export function RewardsSection() {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const rewards = useRewards()

  if (rewards.isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        {t("progression.rewards.loading")}
      </p>
    )
  }

  if (rewards.isError || !rewards.data) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<GiftIcon className="size-6 text-muted-foreground" />}
          title={t("progression.rewards.errorTitle")}
          description={t("progression.rewards.errorDescription")}
        >
          <Button variant="outline" onClick={() => void rewards.refetch()}>
            {t("progression.rewards.retry")}
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("progression.rewards.title")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("progression.rewards.count", {
            count: rewards.data.rewards.length,
          })}
        </span>
      </div>

      <div className="grid gap-3 tablet-up:grid-cols-2">
        {rewards.data.rewards.map((reward) => (
          <RewardCard
            key={reward.code}
            reward={reward}
            locale={locale}
            onOpenEditor={() => void navigate("/settings/avatar")}
          />
        ))}
      </div>
    </div>
  )
}

function RewardCard({
  reward,
  locale,
  onOpenEditor,
}: {
  reward: Reward
  locale: string
  onOpenEditor: () => void
}) {
  const { t } = useTranslation()
  const metadata = rewardMetadata(reward.code)
  const label = metadata ? t(metadata.labelKey) : reward.code
  const description = metadata ? t(metadata.descriptionKey) : null
  const badgeKey = badgeLabelKey(reward.condition.badgeCode)
  const badgeLabel = badgeKey ? t(badgeKey) : reward.condition.badgeLabel
  const condition = metadata?.conditionKey
    ? t(metadata.conditionKey)
    : t("progression.rewards.condition", {
        badge: badgeLabel,
        target: reward.condition.target,
      })
  const sourceKey = rewardSourceKey(reward.source)
  const source = sourceKey ? t(sourceKey) : reward.source

  return (
    <Card className={cn(!reward.unlocked && LOCKED_SURFACE_CLASS)}>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className={cn("shrink-0", !reward.unlocked && LOCKED_VISUAL_CLASS)}
          >
            {metadata?.avatarStyle ? (
              <UserAvatar
                name={label}
                avatarOptions={JSON.stringify({
                  style: metadata.avatarStyle,
                })}
                size={84}
                eloFrame={false}
              />
            ) : (
              <span className="grid size-[84px] place-items-center rounded-full bg-muted text-muted-foreground">
                <GiftIcon className="size-8" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading text-base font-semibold">{label}</h3>
              <span
                className={
                  reward.unlocked
                    ? "inline-flex items-center gap-1 text-xs font-semibold text-success-600"
                    : "inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"
                }
              >
                {reward.unlocked ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  <LockIcon className="size-3.5" />
                )}
                {t(
                  reward.unlocked
                    ? "progression.rewards.unlocked"
                    : "progression.rewards.locked"
                )}
              </span>
            </div>
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {reward.unlocked ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              {t("progression.rewards.unlockedOn", {
                date: reward.unlockedAt
                  ? formatUnlockedAt(reward.unlockedAt, locale)
                  : "—",
              })}
              {source
                ? ` · ${t("progression.rewards.source", { source })}`
                : ""}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="self-start"
              onClick={onOpenEditor}
            >
              {t("progression.rewards.openEditor")}
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            {condition}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
