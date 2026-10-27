import { describe, expect, it } from "vitest"
import type { GameNotification } from "./game-notification"
import { applyGameNotification, emptyGame } from "./game-fold"
import type { GameState } from "./game"
import { sceneAt } from "./arena-timeline"
import {
  MATCH_INTRO_MS,
  RESULT_DELAY_MS,
  ROUND_SECONDS,
} from "./game-constants"

const T0 = Date.parse("2026-10-06T10:00:00Z")
const FIRST_ROUND_AT = T0 + MATCH_INTRO_MS
const SHOWN_AT = FIRST_ROUND_AT
const REVEAL_AT = SHOWN_AT + 1_980
const DEADLINE = REVEAL_AT + ROUND_SECONDS * 1_000
const CLOSED_AT = REVEAL_AT + 5_000
const NEXT_ROUND_AT = CLOSED_AT + 4_400

const iso = (ms: number) => new Date(ms).toISOString()

const created: GameNotification = {
  type: "GAME_CREATED",
  gameId: "game-1",
  topicId: "topic-1",
  player1Id: "u1",
  player1Name: "Alice",
  player2Id: "u2",
  player2Name: "Bob",
  player2Type: "BOT",
  botDifficulty: "NORMAL",
  questionImageUrls: [],
}

const started: GameNotification = {
  type: "GAME_STARTED",
  gameId: "game-1",
  firstRoundAt: iso(FIRST_ROUND_AT),
}

const roundStarted: GameNotification = {
  type: "ROUND_STARTED",
  gameId: "game-1",
  round: "ROUND_1",
  questionId: "q1",
  questionText: "Question ?",
  imageUrl: null,
  difficulty: null,
  answers: { A: "un", B: "deux" },
  translations: {},
  bonus: false,
  shownAt: iso(SHOWN_AT),
  revealAt: iso(REVEAL_AT),
}

const revealed: GameNotification = {
  type: "QUESTION_REVEALED",
  gameId: "game-1",
  round: "ROUND_1",
  revealedAt: iso(REVEAL_AT),
  answerDeadlineAt: iso(DEADLINE),
}

const closed: GameNotification = {
  type: "ROUND_CLOSED",
  gameId: "game-1",
  closedRound: "ROUND_1",
  nextRound: "ROUND_2",
  correctAnswer: "A",
  closedAt: iso(CLOSED_AT),
  nextRoundAt: iso(NEXT_ROUND_AT),
}

const closedLast: GameNotification = {
  type: "ROUND_CLOSED",
  gameId: "game-1",
  closedRound: "ROUND_1",
  nextRound: null,
  correctAnswer: "A",
  closedAt: iso(CLOSED_AT),
  nextRoundAt: null,
}

function fold(notifications: GameNotification[]): GameState {
  return notifications.reduce(applyGameNotification, emptyGame("game-1"))
}

describe("sceneAt", () => {
  it("affiche la salle d'attente tant qu'aucun round n'a démarré", () => {
    const game = fold([created])

    expect(sceneAt(game, T0)?.kind).toBe("waiting")
  })

  it("déroule l'intro VS → swoosh → annonce recalée sur firstRoundAt", () => {
    const game = fold([created, started])

    expect(sceneAt(game, FIRST_ROUND_AT - 6_000)?.kind).toBe("vs")
    expect(sceneAt(game, FIRST_ROUND_AT - 3_000)?.kind).toBe("swoosh")
    const intro = sceneAt(game, FIRST_ROUND_AT - 500)
    expect(intro.kind).toBe("roundIntro")
    if (intro.kind === "roundIntro") {
      expect(intro.round).toBe(0)
      expect(intro.elapsedMs).toBe(1_400)
      expect(intro.remainingMs).toBe(500)
    }
  })

  it("démarre l'intro à son point exact quand le client arrive en cours de fenêtre", () => {
    const game = fold([created, started])

    const scene = sceneAt(game, FIRST_ROUND_AT - 2_800)
    expect(scene.kind).toBe("swoosh")
    if (scene.kind === "swoosh") {
      expect(scene.elapsedMs).toBe(550)
    }
  })

  it("question verrouillée avant le reveal, ouverte ensuite avec la deadline serveur", () => {
    const game = fold([created, started, roundStarted])

    const locked = sceneAt(game, SHOWN_AT + 500)
    expect(locked.kind).toBe("question")
    if (locked.kind === "question") {
      expect(locked.locked).toBe(true)
      expect(locked.timeLeft).toBe(ROUND_SECONDS)
      expect(locked.elapsedMs).toBe(500)
      expect(locked.overdue).toBe(false)
    }

    const open = sceneAt(
      fold([created, started, roundStarted, revealed]),
      REVEAL_AT + 3_000
    )
    expect(open.kind).toBe("question")
    if (open.kind === "question") {
      expect(open.locked).toBe(false)
      expect(open.timeLeft).toBe(7)
    }
  })

  it("reconstitue la timeline d'une arrivée tardive au milieu d'un round", () => {
    const game = fold([created, started, roundStarted, revealed])

    const scene = sceneAt(game, REVEAL_AT + 2_500)
    expect(scene.kind).toBe("question")
    if (scene.kind === "question") {
      expect(scene.timeLeft).toBe(7.5)
      expect(scene.elapsedMs).toBe(REVEAL_AT + 2_500 - SHOWN_AT)
      expect(scene.roundState.questionId).toBe("q1")
    }
  })

  it("révèle la réponse puis annonce le round suivant", () => {
    const game = fold([created, started, roundStarted, revealed, closed])

    const reveal = sceneAt(game, CLOSED_AT + 1_000)
    expect(reveal.kind).toBe("reveal")
    if (reveal.kind === "reveal") {
      expect(reveal.timeLeft).toBe(5)
      expect(reveal.overdue).toBe(false)
    }

    const intro = sceneAt(game, NEXT_ROUND_AT - 300)
    expect(intro.kind).toBe("roundIntro")
    if (intro.kind === "roundIntro") {
      expect(intro.round).toBe(1)
      expect(intro.remainingMs).toBe(300)
    }
  })

  it("signale overdue quand la transition serveur attendue n'arrive pas", () => {
    const game = fold([created, started, roundStarted, revealed])

    const scene = sceneAt(game, DEADLINE + 2_000)
    expect(scene.kind).toBe("question")
    if (scene.kind === "question") {
      expect(scene.timeLeft).toBe(0)
      expect(scene.overdue).toBe(true)
    }
  })

  it("passe au résultat après le délai de révélation du dernier round", () => {
    const game = fold([
      created,
      started,
      roundStarted,
      revealed,
      closedLast,
      {
        type: "GAME_ENDED",
        gameId: "game-1",
        winnerId: "u1",
        player1FinalScore: 10,
        player2FinalScore: 0,
      },
    ])

    expect(sceneAt(game, CLOSED_AT + 1_000)?.kind).toBe("reveal")
    expect(sceneAt(game, CLOSED_AT + RESULT_DELAY_MS + 1)?.kind).toBe("result")
  })

  it("affiche directement le résultat d'une partie consultée après coup", () => {
    const game = fold([
      created,
      started,
      roundStarted,
      revealed,
      closedLast,
      {
        type: "GAME_ENDED",
        gameId: "game-1",
        winnerId: "u1",
        player1FinalScore: 10,
        player2FinalScore: 0,
      },
    ])

    const scene = sceneAt(game, T0 + 24 * 3_600_000)
    expect(scene.kind).toBe("result")
  })

  it("traite une partie annulée comme un résultat", () => {
    const game = fold([
      created,
      { type: "GAME_CANCELLED", gameId: "game-1", reason: "NO_SHOW_START" },
    ])

    expect(sceneAt(game, T0)?.kind).toBe("result")
  })

  it("reste déterministe si GAME_STARTED est manqué : les rounds suffisent", () => {
    const game = fold([created, roundStarted, revealed])

    const scene = sceneAt(game, REVEAL_AT + 1_000)
    expect(scene.kind).toBe("question")
    if (scene.kind === "question") {
      expect(scene.timeLeft).toBe(9)
    }
  })
})
