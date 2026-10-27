import { frozenTimeLeft, type GameRoundState, type GameState } from "./game"

export interface ReviewScores {
  you: number
  them: number
}

/**
 * Manche enrichie pour l'écran de revue : scores cumulés avant/après et temps de réponse des
 * deux joueurs. `round` porte la question et les choix (localisés à l'affichage).
 */
export interface ReviewRound {
  /** Numéro de manche 1-based (position de la pastille dans la revue). */
  index: number
  round: GameRoundState
  /** Scores cumulés avant cette manche. */
  scoresBefore: ReviewScores
  /** Scores cumulés après cette manche. */
  scoresAfter: ReviewScores
  /** Chrono gelé à la clôture de la manche (miroir du centre de `MatchHeader`). */
  frozenTimeLeft: number
  yourTimeMs: number | null
  theirTimeMs: number | null
}

function roundNumberOf(round: string): number {
  const parsed = Number(round.replace("ROUND_", ""))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Ordonne les manches par numéro (`ROUND_1`, `ROUND_2`…), quel que soit l'ordre du fold. */
export function sortReviewRounds(
  rounds: Record<string, GameRoundState>
): GameRoundState[] {
  return Object.values(rounds).sort(
    (a, b) => roundNumberOf(a.round) - roundNumberOf(b.round)
  )
}

/**
 * Reconstruit le fil des manches pour la revue de questions : scores cumulés avant/après
 * chaque manche et temps de réponse de chaque joueur. Purement dérivé de l'état de partie
 * (aucun fetch) — les manches absentes du fold sont simplement ignorées.
 */
export function buildReviewRounds(
  game: GameState,
  userId: string,
  opponentId: string | null
): ReviewRound[] {
  let you = 0
  let them = 0

  return sortReviewRounds(game.rounds).map((round, position) => {
    const scoresBefore = { you, them }
    you += round.playerAnswers[userId]?.points ?? 0
    them += opponentId ? (round.playerAnswers[opponentId]?.points ?? 0) : 0

    return {
      index: position + 1,
      round,
      scoresBefore,
      scoresAfter: { you, them },
      frozenTimeLeft: frozenTimeLeft(round),
      yourTimeMs: round.playerAnswers[userId]?.timeMs ?? null,
      theirTimeMs: opponentId
        ? (round.playerAnswers[opponentId]?.timeMs ?? null)
        : null,
    }
  })
}
