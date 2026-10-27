import { describe, expect, it } from "vitest"
import type { GameNotification } from "./game-notification"
import { applyGameNotification, emptyGame } from "./game-fold"
import {
  answerDeadlineMs,
  displayTimeLeft,
  firstAnswerPct,
  firstResponder,
  frozenTimeLeft,
  isGameAccessDenied,
  localizedQuestion,
  resultOutcome,
  roundTransitionOverdue,
  type GameRoundState,
  type PlayerAnswer,
} from "./game"

function fold(notifications: GameNotification[]) {
  return notifications.reduce(applyGameNotification, emptyGame("game-1"))
}

const created: GameNotification = {
  type: "GAME_CREATED",
  gameId: "game-1",
  topicId: "topic-1",
  player1Id: "u1",
  player1Name: "Alice",
  player2Id: "u2",
  player2Name: "Bob",
  player2Type: "HUMAN",
  botDifficulty: null,
  questionImageUrls: ["https://example.com/illustration.png"],
}

const roundStarted: GameNotification = {
  type: "ROUND_STARTED",
  gameId: "game-1",
  round: "ROUND_1",
  questionId: "q1",
  questionText: "Question ?",
  imageUrl: "https://example.com/illustration.png",
  difficulty: "MEDIUM",
  answers: { A: "un", B: "deux" },
  translations: {
    en: { text: "Question in English?", answers: { A: "one", B: "two" } },
  },
  bonus: false,
  shownAt: "2026-09-18T10:00:00Z",
  revealAt: "2026-09-18T10:00:02Z",
}

describe("isGameAccessDenied", () => {
  it("reconnaît le 403 du BFF et ignore les autres erreurs", () => {
    expect(isGameAccessDenied({ statusCode: 403 })).toBe(true)
    expect(isGameAccessDenied({ statusCode: 404 })).toBe(false)
    expect(isGameAccessDenied(new Error("boom"))).toBe(false)
    expect(isGameAccessDenied(null)).toBe(false)
  })
})

describe("applyGameNotification", () => {
  it("reconstruit l'état d'une manche et les scores", () => {
    const game = fold([
      created,
      {
        type: "GAME_STARTED",
        gameId: "game-1",
        firstRoundAt: "2026-09-18T10:00:00Z",
      },
      roundStarted,
      {
        type: "QUESTION_REVEALED",
        gameId: "game-1",
        round: "ROUND_1",
        revealedAt: "2026-09-18T10:00:02Z",
        answerDeadlineAt: "2026-09-18T10:00:12Z",
      },
      {
        type: "PLAYER_ANSWERED",
        gameId: "game-1",
        round: "ROUND_1",
        playerId: "u1",
        choice: "A",
        correct: true,
        pointsEarned: 120,
        answeredAt: "2026-09-18T10:00:04Z",
        timeMs: 2000,
      },
      {
        type: "ROUND_CLOSED",
        gameId: "game-1",
        closedRound: "ROUND_1",
        nextRound: "ROUND_2",
        correctAnswer: "A",
        closedAt: "2026-09-18T10:00:12Z",
        nextRoundAt: "2026-09-18T10:00:14Z",
      },
    ])

    expect(game.status).toBe("IN_PROGRESS")
    expect(game.player1Score).toBe(120)
    expect(game.player2Score).toBe(0)
    expect(game.questionImageUrls).toEqual([
      "https://example.com/illustration.png",
    ])
    const round = game.rounds["ROUND_1"]
    expect(round.questionId).toBe("q1")
    expect(round.imageUrl).toBe("https://example.com/illustration.png")
    expect(round.difficulty).toBe("MEDIUM")
    expect(round.phase).toBe("CLOSED")
    expect(round.correctAnswer).toBe("A")
    expect(round.playerAnswers["u1"]?.correct).toBe(true)
  })

  it("reste idempotent en cas de rejeu d'une notification", () => {
    const answered: GameNotification = {
      type: "PLAYER_ANSWERED",
      gameId: "game-1",
      round: "ROUND_1",
      playerId: "u1",
      choice: "A",
      correct: true,
      pointsEarned: 120,
      answeredAt: "2026-09-18T10:00:04Z",
      timeMs: 2000,
    }
    const base = fold([created, roundStarted])
    const appliedOnce = applyGameNotification(base, answered)
    const appliedTwice = applyGameNotification(appliedOnce, answered)

    expect(appliedOnce.player1Score).toBe(120)
    // Le fold lui-même n'accumule pas deux fois si on repasse la même notif : la dédup par
    // séquence est faite par le stream. Ici on vérifie que réappliquer écrit la même réponse.
    expect(appliedTwice.rounds["ROUND_1"]?.playerAnswers["u1"]).toEqual(
      appliedOnce.rounds["ROUND_1"]?.playerAnswers["u1"]
    )
  })

  it("fixe les scores autoritaires à la fin", () => {
    const game = fold([
      created,
      {
        type: "GAME_ENDED",
        gameId: "game-1",
        winnerId: "u2",
        player1FinalScore: 300,
        player2FinalScore: 420,
      },
    ])

    expect(game.status).toBe("FINISHED")
    expect(game.winnerId).toBe("u2")
    expect(game.player1Score).toBe(300)
    expect(game.player2Score).toBe(420)
  })

  it("préserve l'état sur une notification inconnue (garde défensive)", () => {
    const base = fold([created, roundStarted])
    const unknown = { type: "UNKNOWN_TYPE" } as unknown as GameNotification

    expect(applyGameNotification(base, unknown)).toEqual(base)
  })

  it("résout la question dans la langue du joueur, avec repli sur la source", () => {
    const round = fold([created, roundStarted]).rounds["ROUND_1"]

    expect(localizedQuestion(round, "en").questionText).toBe(
      "Question in English?"
    )
    expect(localizedQuestion(round, "en").answers).toEqual({
      A: "one",
      B: "two",
    })
    expect(localizedQuestion(round, "de").questionText).toBe("Question ?")
    expect(localizedQuestion(round, "de").answers).toEqual({
      A: "un",
      B: "deux",
    })
    expect(localizedQuestion(null, "en")).toEqual({
      questionText: "",
      answers: {},
    })
  })

  it("enregistre le forfait sans clore la partie avant GAME_ENDED", () => {
    const game = fold([
      created,
      { type: "GAME_FORFEITED", gameId: "game-1", forfeiterId: "u1" },
    ])

    expect(game.forfeiterId).toBe("u1")
    expect(game.status).toBe("IN_PROGRESS")
  })
})

function closedRound(overrides: Partial<GameRoundState>): GameRoundState {
  return {
    round: "ROUND_1",
    questionId: "q1",
    questionText: "Question ?",
    imageUrl: null,
    difficulty: null,
    answers: {},
    translations: {},
    bonus: false,
    phase: "CLOSED",
    shownAt: null,
    revealAt: null,
    revealedAt: null,
    answerDeadlineAt: null,
    closedAt: null,
    nextRoundAt: null,
    correctAnswer: null,
    playerAnswers: {},
    ...overrides,
  }
}

describe("chrono", () => {
  it("gèle au temps de clôture (pas de saut à 0 quand les deux ont répondu)", () => {
    const round = closedRound({
      revealedAt: "2026-09-18T10:00:00Z",
      answerDeadlineAt: "2026-09-18T10:00:10Z",
      closedAt: "2026-09-18T10:00:04Z",
    })

    expect(frozenTimeLeft(round)).toBe(6)
  })

  it("gèle à 0 en cas d'expiration", () => {
    const round = closedRound({
      answerDeadlineAt: "2026-09-18T10:00:10Z",
      closedAt: "2026-09-18T10:00:12Z",
    })

    expect(frozenTimeLeft(round)).toBe(0)
  })

  it("affiche plein à l'intro, gelé à la révélation, décompté en question", () => {
    const round = closedRound({
      answerDeadlineAt: "2026-09-18T10:00:10Z",
      closedAt: "2026-09-18T10:00:04Z",
    })

    expect(displayTimeLeft("intro", 3, round)).toBe(10)
    expect(displayTimeLeft("reveal", 3, round)).toBe(6)
    expect(displayTimeLeft("question", 7.4, round)).toBe(7.4)
  })
})

describe("deadline de réponse", () => {
  it("privilégie l'échéance autoritaire du serveur", () => {
    const round = closedRound({
      revealAt: "2026-09-18T10:00:02Z",
      answerDeadlineAt: "2026-09-18T10:00:12Z",
    })

    expect(answerDeadlineMs(round)).toBe(Date.parse("2026-09-18T10:00:12Z"))
  })

  it("projette la deadline depuis revealAt tant que QUESTION_REVEALED n'est pas reçue", () => {
    const round = closedRound({
      phase: "QUESTION_SHOWN",
      revealAt: "2026-09-18T10:00:02Z",
    })

    expect(answerDeadlineMs(round)).toBe(Date.parse("2026-09-18T10:00:12Z"))
  })

  it("retourne null sans revealAt ni deadline", () => {
    expect(
      answerDeadlineMs(closedRound({ phase: "QUESTION_SHOWN" }))
    ).toBeNull()
    expect(answerDeadlineMs(null)).toBeNull()
  })
})

describe("issue d'une partie", () => {
  it("dérive win/loss/draw du vainqueur autoritaire", () => {
    expect(resultOutcome("u1", "u1")).toBe("win")
    expect(resultOutcome("u2", "u1")).toBe("loss")
    expect(resultOutcome(null, "u1")).toBe("draw")
  })
})

describe("transition en retard", () => {
  const grace = 1_500

  it("détecte QUESTION_REVEALED manquée après revealAt + grâce", () => {
    const round = closedRound({
      phase: "QUESTION_SHOWN",
      revealAt: "2026-09-18T10:00:02Z",
    })
    const revealAt = Date.parse("2026-09-18T10:00:02Z")

    expect(roundTransitionOverdue(round, revealAt + 1_000, grace)).toBe(false)
    expect(roundTransitionOverdue(round, revealAt + 2_000, grace)).toBe(true)
  })

  it("détecte ROUND_CLOSED manquée après la deadline projetée", () => {
    const round = closedRound({
      phase: "ANSWERABLE",
      revealAt: "2026-09-18T10:00:02Z",
    })
    const deadline = Date.parse("2026-09-18T10:00:12Z")

    expect(roundTransitionOverdue(round, deadline + 1_000, grace)).toBe(false)
    expect(roundTransitionOverdue(round, deadline + 2_000, grace)).toBe(true)
  })

  it("détecte le round suivant manqué après nextRoundAt", () => {
    const round = closedRound({
      phase: "CLOSED",
      nextRoundAt: "2026-09-18T10:00:18Z",
    })
    const nextRoundAt = Date.parse("2026-09-18T10:00:18Z")

    expect(roundTransitionOverdue(round, nextRoundAt + 1_000, grace)).toBe(
      false
    )
    expect(roundTransitionOverdue(round, nextRoundAt + 2_000, grace)).toBe(true)
  })

  it("ne signale rien sans round ou sans instant attendu", () => {
    expect(roundTransitionOverdue(null, Date.now(), grace)).toBe(false)
    expect(
      roundTransitionOverdue(
        closedRound({ phase: "QUESTION_SHOWN" }),
        Date.now(),
        grace
      )
    ).toBe(false)
  })
})

describe("premier à répondre", () => {
  const playerAnswer = (timeMs: number): PlayerAnswer => ({
    choice: "A",
    correct: true,
    points: 10,
    timeMs,
  })

  it("place le repère selon le temps de réponse le plus court", () => {
    const round = closedRound({
      playerAnswers: { u1: playerAnswer(2_500), u2: playerAnswer(7_500) },
    })

    expect(firstAnswerPct(round)).toBe(75)
  })

  it("retourne null sans réponse ni round", () => {
    expect(firstAnswerPct(closedRound({}))).toBeNull()
    expect(firstAnswerPct(null)).toBeNull()
  })

  it("désigne le joueur le plus rapide", () => {
    const round = closedRound({
      playerAnswers: { u1: playerAnswer(4_000), u2: playerAnswer(1_500) },
    })

    expect(firstResponder(round, "u1", "u2")).toEqual({
      playerId: "u2",
      timeMs: 1_500,
    })
  })

  it("ignore l'adversaire d'un bot et gère l'absence de réponse", () => {
    const round = closedRound({ playerAnswers: { u1: playerAnswer(4_000) } })

    expect(firstResponder(round, "u1", null)).toEqual({
      playerId: "u1",
      timeMs: 4_000,
    })
    expect(firstResponder(closedRound({}), "u1", "u2")).toBeNull()
    expect(firstResponder(null, "u1", "u2")).toBeNull()
  })
})
