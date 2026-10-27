import type { CSSProperties } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Check, Equal, X, type LucideIcon } from "lucide-react"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardHeading,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
import { TopicIcon } from "@/shared/components/topic-icon"
import { SuspendedBadge } from "@/shared/components/suspended-badge"
import { UserAvatar } from "@/shared/components/user-avatar"
import type { TranslationKey } from "@/lib/i18n/types"
import {
  isFinishedOutcome,
  type GameHistoryItem,
} from "@/features/player/domain/history"
import { useTopicName } from "@/features/shell"
import { cn } from "cn"

const OUTCOME_KEYS: Record<GameHistoryItem["outcome"], TranslationKey> = {
  WIN: "topic.matchList.outcomes.win",
  LOSS: "topic.matchList.outcomes.loss",
  DRAW: "topic.matchList.outcomes.draw",
  WAITING: "topic.matchList.outcomes.waiting",
  IN_PROGRESS: "topic.matchList.outcomes.inProgress",
  CANCELLED: "topic.matchList.outcomes.cancelled",
}

/** Teinte du libellé des statuts sans bilan sportif (en attente, en cours, annulée). */
const PENDING_COLOR = "var(--draw)"

interface OutcomeAccent {
  icon: LucideIcon
  /** Teinte de l'issue : bordure, fond et score. */
  color: string
  borderColor: string
  /** Bordure au survol : la teinte de l'issue renforcée (recette de la tuile de badge). */
  hoverBorderColor: string
  background: string
  /** Disque assombri de la pastille (encre blanche), comme la coche d'un titre atteint. */
  badgeBackground: string
}

/**
 * Accent d'une carte terminée — **même recette que la carte de titre débloquée**
 * (`TITLE_CARD_ACCENT.unlocked` / `acquiredCheck`) : bordure 40 %, fond 8 % mélangé à
 * `--card`, pastille 80 % + noir. La victoire prend le **vert des titres** (`--success-600`) ;
 * la défaite et le nul gardent les teintes V/N/D (`--loss` / `--draw`). Au survol, seule la
 * **bordure** s'accentue (70 %, comme la tuile de badge acquise) : le fond reste celui de
 * l'issue.
 */
function cardAccent(icon: LucideIcon, color: string): OutcomeAccent {
  return {
    icon,
    color,
    borderColor: `color-mix(in oklab, ${color} 40%, transparent)`,
    hoverBorderColor: `color-mix(in oklab, ${color} 70%, transparent)`,
    background: `color-mix(in oklab, ${color} 8%, var(--card))`,
    badgeBackground: `color-mix(in oklab, ${color} 80%, black)`,
  }
}

const OUTCOME_ACCENT: Partial<
  Record<GameHistoryItem["outcome"], OutcomeAccent>
> = {
  WIN: cardAccent(Check, "var(--success-600)"),
  LOSS: cardAccent(X, "var(--loss)"),
  DRAW: cardAccent(Equal, "var(--draw)"),
}

function opponentName(item: GameHistoryItem, t: TFunction): string {
  if (item.opponent?.pseudonym) return item.opponent.pseudonym
  return item.opponentType === "BOT"
    ? t("topic.matchList.bot")
    : t("topic.matchList.opponent")
}

/** Partie terminée : lien direct vers la page résultat (pas de chargement d'arène). */
function gameHref(item: GameHistoryItem): string {
  return isFinishedOutcome(item.outcome)
    ? `/game/${item.gameId}/result`
    : `/game/${item.gameId}`
}

/** Liste de duels — pour les parties terminées : pastille d'issue à icône blanche, avatar de
 *  l'adversaire, puis titre du sujet / ligne adversaire, et visuel du sujet tout à droite.
 *  Les statuts sans bilan gardent le visuel du sujet à gauche, l'avatar dans la description et
 *  le libellé texte à droite. Score à partir de la tablette. Une carte terminée porte la **teinte
 *  de son issue** (recette de
 *  la carte de titre débloquée) ; au survol, seule la **bordure** s'accentue (comme la tuile de
 *  badge), le fond ne change pas. Chaque carte ouvre directement la page résultat d'une partie
 *  terminée (sinon l'arène). */
export function MatchList({
  items,
  /** Fiche d'un autre joueur : le scope est déjà « contre X », la ligne adversaire est redondante. */
  showOpponent = true,
}: {
  items: GameHistoryItem[]
  showOpponent?: boolean
}) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const name = opponentName(item, t)
        const topicName = resolveName(item.topic.names)
        const accent = OUTCOME_ACCENT[item.outcome]
        const outcomeLabel = t(OUTCOME_KEYS[item.outcome])
        const BadgeIcon = accent?.icon

        return (
          <Link
            key={item.gameId}
            to={gameHref(item)}
            aria-label={
              showOpponent
                ? t("topic.matchList.openAria", { name })
                : t("topic.matchList.openAriaTopic", { topic: topicName })
            }
            className="block rounded-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {/* Le fond teinté est inline (recette opaque) : le survol ne touche que la
                bordure — teinte de l'issue à 70 % (tuile de badge acquise), ou
                `foreground/20` pour une carte neutre. La variante `!` de la bordure
                surcharge l'inline, comme la tuile de badge. */}
            <Card
              className={cn(
                "cursor-pointer gap-0 transition-colors",
                accent
                  ? "hover:[border-color:var(--match-hover-border)]!"
                  : "hover:border-foreground/20"
              )}
              style={
                accent
                  ? ({
                      "--match-hover-border": accent.hoverBorderColor,
                      borderColor: accent.borderColor,
                      backgroundColor: accent.background,
                    } as CSSProperties)
                  : undefined
              }
            >
              <CardHeader>
                <div className="flex shrink-0 items-center gap-2">
                  <CardMedia>
                    {accent && BadgeIcon ? (
                      <span
                        role="img"
                        aria-label={outcomeLabel}
                        title={outcomeLabel}
                        className="grid size-9 shrink-0 place-items-center rounded-full text-white"
                        style={{ background: accent.badgeBackground }}
                      >
                        <BadgeIcon
                          className="size-4"
                          strokeWidth={3}
                          aria-hidden
                        />
                      </span>
                    ) : (
                      <TopicIcon topic={item.topic} size={36} />
                    )}
                  </CardMedia>
                  {accent && BadgeIcon && showOpponent && (
                    <UserAvatar
                      name={name}
                      userId={item.opponent?.userId}
                      avatarOptions={item.opponent?.avatarOptions ?? undefined}
                      size={32}
                    />
                  )}
                </div>

                <CardHeading>
                  <CardTitle className="truncate">{topicName}</CardTitle>
                  {showOpponent && (
                    <CardDescription className="flex min-w-0 items-center gap-1.5">
                      {!accent && (
                        <UserAvatar
                          name={name}
                          userId={item.opponent?.userId}
                          avatarOptions={
                            item.opponent?.avatarOptions ?? undefined
                          }
                          size={18}
                        />
                      )}
                      <span className="truncate">
                        {t("topic.matchList.against", { name })}
                      </span>
                      {item.opponent?.suspended ? (
                        <SuspendedBadge className="scale-90" />
                      ) : null}
                    </CardDescription>
                  )}
                </CardHeading>

                <CardAction className="gap-3">
                  {/* Score : uniquement les parties au bilan définitif, à partir de la tablette. */}
                  {isFinishedOutcome(item.outcome) && accent && (
                    <div className="hidden items-center gap-1 font-heading text-base font-bold tablet-up:flex">
                      <span style={{ color: accent.color }}>
                        {item.myScore}
                      </span>
                      <span className="text-xs text-muted-foreground">—</span>
                      <span className="text-muted-foreground">
                        {item.opponentScore}
                      </span>
                    </div>
                  )}
                  {accent && BadgeIcon ? (
                    <TopicIcon topic={item.topic} size={36} />
                  ) : (
                    <div
                      className="text-xs font-semibold tablet-up:w-[82px] tablet-up:text-right"
                      style={{ color: PENDING_COLOR }}
                    >
                      {outcomeLabel}
                    </div>
                  )}
                </CardAction>
              </CardHeader>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
