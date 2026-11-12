import type { GameHistoryItemView, GameOutcome } from '@joutio/client-domain/api-types'
import type { MatchOutcome } from '@/ui'

export const OUTCOMES: Partial<Record<GameOutcome, MatchOutcome>> = { WIN: 'win', LOSS: 'loss', DRAW: 'draw' }

/** Parties terminées seulement : une partie en attente ou annulée n'a pas d'issue à montrer. */
export const finishedGames = (games: readonly GameHistoryItemView[]) => games.filter((game) => OUTCOMES[game.outcome])
