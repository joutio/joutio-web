import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, ChevronLeft, ChevronRight, Flag } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import { localizedQuestion } from "../domain/game"
import { buildReviewRounds } from "../domain/review"
import type { GameState } from "../domain/game"
import { ReportQuestionDialog } from "./report/ReportQuestionDialog"
import { ActionButton } from "./result/ActionButton"
import { ReviewQuestion } from "./ReviewQuestion"

interface ReviewDeckProps {
  game: GameState
  userId: string
  opponentId: string | null
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  language: string
  /** Libellé d'accessibilité de la région carousel. */
  label?: string
  className?: string
}

/**
 * Revue des questions d'un duel terminé : carousel **shadcn natif** (embla) dont chaque slide
 * rejoue une manche ({@link ReviewQuestion}, composition d'arène figée). Une **seule** source de
 * rendu pour les deux surfaces — inline dans la colonne droite desktop et dans la bottom sheet
 * tactile — le contenu est donc strictement identique de part et d'autre. Navigation par glisser
 * (embla), flèches clavier, ou boutons libellés « Précédent » / « Suivant » du pied, avec bouton
 * de signalement de la question et compteur.
 */
export function ReviewDeck({
  game,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
  label,
  className,
}: ReviewDeckProps) {
  const { t } = useTranslation()
  const rounds = useMemo(
    () => buildReviewRounds(game, userId, opponentId),
    [game, userId, opponentId]
  )
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportedQuestionIds, setReportedQuestionIds] = useState<Set<string>>(
    new Set()
  )
  const total = rounds.length

  useEffect(() => {
    if (!api) return
    const onSelect = () => setIndex(api.selectedScrollSnap())
    onSelect()
    api.on("select", onSelect)
    api.on("reInit", onSelect)
    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  if (total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
          {t("game.review.empty")}
        </p>
      </div>
    )
  }

  const safeIndex = Math.min(index, total - 1)
  // Même hauteur, rayon et typographie que les ActionButton du résultat (Revanche,
  // Nouvel adversaire, Signaler).
  const navButtonStyle = {
    color: TOKEN.duelSurface,
    height: "clamp(42px, 6.2dvh, 54px)",
    borderRadius: 14,
    paddingInline: "clamp(8px, 2vw, 14px)",
    fontFamily: TOKEN.fontDisplay,
    fontSize: "clamp(13px, 2dvh, 16px)",
  } as const
  const currentRound = rounds[safeIndex]
  const currentQuestionId = currentRound?.round.questionId ?? null
  const currentLocalized = currentRound
    ? localizedQuestion(currentRound.round, language)
    : { questionText: "", answers: {} }
  const alreadyReported =
    currentQuestionId != null && reportedQuestionIds.has(currentQuestionId)

  const openReport = () => setReportOpen(true)
  const closeReport = () => setReportOpen(false)

  return (
    <div
      className={cn(
        "qu-review-deck flex h-full min-h-0 w-full flex-col",
        className
      )}
      style={{ gap: "clamp(6px, 1.4dvh, 12px)" }}
    >
      <Carousel
        setApi={setApi}
        opts={{ align: "start" }}
        aria-label={label}
        className="min-h-0 flex-1"
      >
        <CarouselContent className="h-full items-stretch">
          {rounds.map((review) => (
            <CarouselItem key={review.index} className="h-full">
              <ReviewQuestion
                review={review}
                userId={userId}
                opponentId={opponentId}
                playerName={playerName}
                opponentName={opponentName}
                playerAvatar={playerAvatar}
                opponentAvatar={opponentAvatar}
                language={language}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div
        className="flex shrink-0 flex-col"
        style={{
          gap: "clamp(6px, 1.4dvh, 12px)",
          padding: "0 clamp(12px, 4vw, 22px) clamp(4px, 1dvh, 10px)",
        }}
      >
        <ActionButton
          icon={alreadyReported ? <Check size={16} /> : <Flag size={16} />}
          background={TOKEN.gauge}
          disabled={!currentQuestionId || alreadyReported}
          onClick={openReport}
          ariaLabel={
            alreadyReported ? t("game.report.reported") : t("game.report.aria")
          }
        >
          {alreadyReported
            ? t("game.report.reported")
            : t("game.report.action")}
        </ActionButton>
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center"
          style={{ gap: "clamp(6px, 2vw, 14px)" }}
        >
          <Button
            variant="ghost"
            disabled={safeIndex <= 0}
            onClick={() => api?.scrollPrev()}
            className="qu-btn w-full min-w-0 justify-center font-bold"
            style={navButtonStyle}
          >
            <ChevronLeft size={18} className="shrink-0" />
            <span className="min-w-0 truncate">
              {t("game.review.previous")}
            </span>
          </Button>
          <div
            className="flex flex-wrap items-center justify-center gap-1.5"
            role="group"
            aria-label={t("game.review.counter", {
              current: safeIndex + 1,
              total,
            })}
          >
            {rounds.map((review, dotIndex) => {
              const active = dotIndex === safeIndex
              return (
                <span
                  key={review.index}
                  aria-hidden="true"
                  className={cn(
                    "block rounded-full transition-[width,background-color,opacity] duration-200 motion-reduce:transition-none",
                    active ? "h-2 w-5" : "size-1.5"
                  )}
                  style={{
                    backgroundColor: active
                      ? TOKEN.duelSurface
                      : TOKEN.duelSurfaceMuted,
                    opacity: active ? 1 : 0.5,
                  }}
                />
              )
            })}
          </div>
          <Button
            variant="ghost"
            disabled={safeIndex >= total - 1}
            onClick={() => api?.scrollNext()}
            className="qu-btn w-full min-w-0 justify-center font-bold"
            style={navButtonStyle}
          >
            <span className="min-w-0 truncate">{t("game.review.next")}</span>
            <ChevronRight size={18} className="shrink-0" />
          </Button>
        </div>
      </div>

      {currentQuestionId && (
        <ReportQuestionDialog
          open={reportOpen}
          onClose={closeReport}
          gameId={game.gameId}
          questionId={currentQuestionId}
          questionText={currentLocalized.questionText}
          imageUrl={currentRound?.round.imageUrl}
          language={language}
          onReported={() =>
            setReportedQuestionIds((current) => {
              const next = new Set(current)
              next.add(currentQuestionId)
              return next
            })
          }
        />
      )}
    </div>
  )
}
