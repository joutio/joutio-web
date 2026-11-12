import { sortedRounds, type GameRoundState, type GameState } from '@joutio/client-domain/game'

/** Manches jouées à revoir : sans aucune, le résultat n'a pas de « Détails ». */
export const reviewRoundsOf = (game: GameState): GameRoundState[] => sortedRounds(game).filter((round) => round.phase === 'CLOSED')
