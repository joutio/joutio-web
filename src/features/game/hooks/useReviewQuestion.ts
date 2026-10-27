import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLocale } from "@/lib/i18n/useLocale"
import type { GaugeState } from "../components/ScoreGauge"
import {
  firstAnswerPct,
  firstResponder,
  frozenTimeLeft,
  localizedQuestion,
  type FirstResponder,
} from "../domain/game"
import type { ReviewRound } from "../domain/review"

/** Temps de réponse en secondes, à une décimale selon la locale (« 3,2 s » / « 3.2s »). */
export function formatSeconds(ms: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(ms / 1000)
}

function toAnswerList(
  answers: Record<string, string>
): { choice: string; label: string }[] {
  return Object.keys(answers)
    .sort()
    .map((choice) => ({ choice, label: answers[choice] ?? "" }))
}

interface UseReviewQuestionOptions {
  review: ReviewRound
  userId: string
  opponentId: string | null
  language: string
}

export interface ReviewQuestionView {
  questionText: string
  answers: { choice: string; label: string }[]
  yourPick: string | null
  theirPick: string | null
  correctAnswer: string | null
  yourCorrect: boolean | null
  gauge: { you: GaugeState; them: GaugeState }
  /** Chrono **gelé** au temps de clôture de la manche. */
  timeLeft: number
  /** Repère « premier à répondre » (position sur la barre du chrono). */
  firstAnswerPct: number | null
  first: FirstResponder | null
  /** Temps de réponse localisé sous chaque score (revue). */
  playerNote?: string
  opponentNote?: string
}

/**
 * View model de la revue d'une manche : mêmes règles que l'arène en phase `reveal` (choix égal
 * à la bonne réponse = correct, même l'absence de réponse est fautive) — source unique de rendu
 * pour le bottom sheet tactile et les slides du carousel desktop.
 */
export function useReviewQuestion({
  review,
  userId,
  opponentId,
  language,
}: UseReviewQuestionOptions): ReviewQuestionView {
  const { t } = useTranslation()
  const locale = useLocale()

  const localized = useMemo(
    () => localizedQuestion(review.round, language),
    [review, language]
  )
  const answers = useMemo(() => toAnswerList(localized.answers), [localized])

  const yourAnswer = review.round.playerAnswers[userId] ?? null
  const theirAnswer = opponentId
    ? (review.round.playerAnswers[opponentId] ?? null)
    : null
  const yourPick = yourAnswer?.choice ?? null
  const theirPick = theirAnswer?.choice ?? null
  const correctAnswer = review.round.correctAnswer ?? null

  const gauge: { you: GaugeState; them: GaugeState } = {
    you:
      correctAnswer != null
        ? yourPick === correctAnswer
          ? "correct"
          : "wrong"
        : yourAnswer?.correct === true
          ? "correct"
          : yourAnswer?.correct === false
            ? "wrong"
            : "idle",
    them:
      correctAnswer != null
        ? theirPick === correctAnswer
          ? "correct"
          : "wrong"
        : theirAnswer?.correct === true
          ? "correct"
          : theirAnswer?.correct === false
            ? "wrong"
            : "idle",
  }

  const first = firstResponder(review.round, userId, opponentId)
  const playerNote =
    review.yourTimeMs != null
      ? t("game.review.seconds", {
          time: formatSeconds(review.yourTimeMs, locale),
        })
      : undefined
  const opponentNote =
    review.theirTimeMs != null
      ? t("game.review.seconds", {
          time: formatSeconds(review.theirTimeMs, locale),
        })
      : undefined

  return {
    questionText: localized.questionText,
    answers,
    yourPick,
    theirPick,
    correctAnswer,
    yourCorrect: yourAnswer?.correct ?? null,
    gauge,
    timeLeft: frozenTimeLeft(review.round),
    firstAnswerPct: firstAnswerPct(review.round),
    first,
    playerNote,
    opponentNote,
  }
}
