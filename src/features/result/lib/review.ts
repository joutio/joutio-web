import { Arena, type GameRoundState, type GameState } from '@joutio/client/game'

/** Manches jouées à revoir : sans aucune, le résultat n'a pas de « Détails ». */
export const reviewRoundsOf = (game: GameState): GameRoundState[] => new Arena(game).sortedRounds().filter((round) => round.phase === 'CLOSED')
