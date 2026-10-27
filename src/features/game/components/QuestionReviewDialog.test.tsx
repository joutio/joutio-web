// @vitest-environment jsdom
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { GameState } from "../domain/game"
import { emptyGame } from "../domain/game-fold"

vi.mock("./ReviewQuestion", () => ({
  ReviewQuestion: () => <div data-testid="review-question" />,
}))

vi.mock("@/components/ui/carousel", () => ({
  Carousel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  CarouselContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  CarouselItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock("@/shared/hooks/use-device", () => ({
  useIsTouchLayout: () => true,
}))

vi.mock("@/features/game/hooks/useReportQuestion", () => ({
  useReportQuestion: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { QuestionReviewDialog } from "./QuestionReviewDialog"

function finishedGame(): GameState {
  return {
    ...emptyGame("game-1"),
    status: "FINISHED",
    player1Id: "me",
    player2Id: "opponent",
    rounds: {
      ROUND_1: {
        round: "ROUND_1",
        questionId: "question-1",
        questionText: "Quelle est la capitale de la France ?",
        imageUrl: null,
        difficulty: null,
        answers: { A: "Paris", B: "Lyon" },
        translations: {},
        bonus: false,
        phase: "CLOSED",
        shownAt: null,
        revealAt: null,
        revealedAt: null,
        answerDeadlineAt: null,
        closedAt: null,
        nextRoundAt: null,
        correctAnswer: "A",
        playerAnswers: {},
      },
    },
  }
}

describe("QuestionReviewDialog", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("fr")
  })

  it("ouvre le signalement au premier clic sans remonter la revue", async () => {
    render(
      <QuestionReviewDialog
        open
        onClose={vi.fn()}
        game={finishedGame()}
        userId="me"
        opponentId="opponent"
        playerName="Moi"
        opponentName="Adversaire"
        language="fr"
      />
    )

    const deck = document.querySelector(".qu-review-deck")
    expect(deck).not.toBeNull()

    await userEvent.click(
      screen.getByRole("button", { name: "Signaler cette question" })
    )

    expect(
      screen.getByRole("dialog", { name: "Signaler cette question" })
    ).toBeInTheDocument()
    // Le sheet hôte ne doit pas être remonté : le carousel et l'état du signalement survivent.
    expect(document.querySelector(".qu-review-deck")).toBe(deck)
  })
})
