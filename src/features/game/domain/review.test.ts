import { describe, expect, it } from "vitest"
import { emptyGame } from "./game-fold"
import { type GameRoundState, type GameState, type PlayerAnswer } from "./game"
import { buildReviewRounds } from "./review"

const USER_ID = "u1"
const OPPONENT_ID = "u2"

function closedRound(
  number: number,
  overrides: Partial<GameRoundState> = {}
): GameRoundState {
  return {
    round: `ROUND_${number}`,
    questionId: `q${number}`,
    questionText: `Question ${number} ?`,
    imageUrl: null,
    difficulty: null,
    answers: { A: "un", B: "deux" },
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
    ...overrides,
  }
}

function answer(points: number, timeMs: number, correct = true): PlayerAnswer {
  return { choice: "A", correct, points, timeMs }
}

function gameWithRounds(rounds: GameRoundState[]): GameState {
  return {
    ...emptyGame("game-1"),
    status: "FINISHED",
    player1Id: USER_ID,
    player2Id: OPPONENT_ID,
    rounds: Object.fromEntries(rounds.map((round) => [round.round, round])),
  }
}

describe("buildReviewRounds", () => {
  it("ordonne les manches et cumule les scores avant/après chacune", () => {
    const review = buildReviewRounds(
      gameWithRounds([
        closedRound(3, {
          playerAnswers: {
            [USER_ID]: answer(10, 3_100),
            [OPPONENT_ID]: answer(20, 2_000),
          },
        }),
        closedRound(1, {
          playerAnswers: {
            [USER_ID]: answer(20, 1_500),
            [OPPONENT_ID]: answer(0, 9_000, false),
          },
        }),
        closedRound(2, {
          playerAnswers: {
            [USER_ID]: answer(10, 4_200),
          },
        }),
      ]),
      USER_ID,
      OPPONENT_ID
    )

    expect(review.map((entry) => entry.index)).toEqual([1, 2, 3])
    expect(review[0]?.scoresBefore).toEqual({ you: 0, them: 0 })
    expect(review[0]?.scoresAfter).toEqual({ you: 20, them: 0 })
    expect(review[1]?.scoresBefore).toEqual({ you: 20, them: 0 })
    expect(review[1]?.scoresAfter).toEqual({ you: 30, them: 0 })
    expect(review[2]?.scoresBefore).toEqual({ you: 30, them: 0 })
    expect(review[2]?.scoresAfter).toEqual({ you: 40, them: 20 })
  })

  it("expose le temps de réponse de chaque joueur (null si absent)", () => {
    const review = buildReviewRounds(
      gameWithRounds([
        closedRound(1, {
          playerAnswers: { [USER_ID]: answer(10, 2_400) },
        }),
      ]),
      USER_ID,
      OPPONENT_ID
    )

    expect(review[0]?.yourTimeMs).toBe(2_400)
    expect(review[0]?.theirTimeMs).toBeNull()
  })

  it("ignore le second joueur d'un duel contre un bot (opponentId null)", () => {
    const review = buildReviewRounds(
      gameWithRounds([
        closedRound(1, {
          playerAnswers: {
            [USER_ID]: answer(10, 2_400),
            [OPPONENT_ID]: answer(10, 1_000),
          },
        }),
      ]),
      USER_ID,
      null
    )

    expect(review[0]?.theirTimeMs).toBeNull()
    expect(review[0]?.scoresAfter).toEqual({ you: 10, them: 0 })
  })

  it("gèle le chrono affiché à la clôture de la manche", () => {
    const review = buildReviewRounds(
      gameWithRounds([
        closedRound(1, {
          answerDeadlineAt: "2026-09-18T10:00:10Z",
          closedAt: "2026-09-18T10:00:04Z",
        }),
      ]),
      USER_ID,
      OPPONENT_ID
    )

    expect(review[0]?.frozenTimeLeft).toBe(6)
  })

  it("retombe à zéro sans manche", () => {
    expect(
      buildReviewRounds(emptyGame("game-1"), USER_ID, OPPONENT_ID)
    ).toEqual([])
  })
})
