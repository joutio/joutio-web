import type { TopicRef } from "@/features/topics/domain/topic"
import type { UserRef } from "./profile"

/** Issue d'un duel vue par le joueur consulté (`GameHistoryItemView.Outcome`). */
export type GameOutcome =
  "WIN" | "LOSS" | "DRAW" | "WAITING" | "IN_PROGRESS" | "CANCELLED"

/** Filtre d'issue de l'historique (enum `GameHistoryOutcome`) — relatif au joueur consulté. */
export type GameOutcomeFilter = "ALL" | GameOutcome

/** Type d'adversaire (enum `GamePlayerType`) — `BOT` isole les entraînements. */
export type GameOpponentType = "HUMAN" | "BOT"

/** Filtre de type d'adversaire exposé par la barre d'historique (`ALL` = tous). */
export type GameOpponentTypeFilter = "ALL" | GameOpponentType

/** Ordre de l'historique (enum `GameHistorySort`) — `SCORE` = score du joueur consulté. */
export type GameHistorySort = "RECENT" | "OLDEST" | "SCORE"

/** Taille d'une page d'historique (scroll infini). */
export const HISTORY_PAGE_SIZE = 20

/** Option de filtre d'issue exposée par la barre d'historique (ordre d'affichage). */
export const GAME_OUTCOME_FILTERS: readonly GameOutcomeFilter[] = [
  "ALL",
  "WIN",
  "LOSS",
  "DRAW",
  "IN_PROGRESS",
  "CANCELLED",
]

/** Option de tri exposée par la barre d'historique (ordre d'affichage). */
export const GAME_HISTORY_SORTS: readonly GameHistorySort[] = [
  "RECENT",
  "OLDEST",
  "SCORE",
]

/** Options de type d'adversaire exposées par la barre d'historique. */
export const GAME_OPPONENT_TYPES: readonly GameOpponentTypeFilter[] = [
  "ALL",
  "HUMAN",
  "BOT",
]

/**
 * Gardes des filtres d'historique : une valeur d'URL inconnue (lien trafiqué) retombe sur la
 * valeur par défaut au lieu de partir vers le BFF (enum strict → 400).
 */
export function isGameOutcomeFilter(
  value: string | null
): value is GameOutcomeFilter {
  return (
    value !== null &&
    (GAME_OUTCOME_FILTERS as readonly string[]).includes(value)
  )
}

export function isGameOpponentTypeFilter(
  value: string | null
): value is GameOpponentTypeFilter {
  return (
    value !== null && (GAME_OPPONENT_TYPES as readonly string[]).includes(value)
  )
}

export function isGameHistorySort(
  value: string | null
): value is GameHistorySort {
  return (
    value !== null && (GAME_HISTORY_SORTS as readonly string[]).includes(value)
  )
}

/** Bilan V/N/D des duels communs, **du point de vue du joueur consulté** (`HeadToHeadView`). */
export interface HeadToHead {
  played: number
  wins: number
  losses: number
  draws: number
}

/** Ligne d'historique d'un duel (`GameHistoryItemView`). */
export interface GameHistoryItem {
  gameId: string
  topic: TopicRef
  opponent: UserRef | null
  opponentType: string | null
  outcome: GameOutcome
  myScore: number
  opponentScore: number
  xp: number | null
  playedAt: string
}

/**
 * Partie au bilan sportif définitif (score affichable) — exclut en attente, en cours et annulée.
 */
export function isFinishedOutcome(outcome: GameOutcome): boolean {
  return outcome === "WIN" || outcome === "LOSS" || outcome === "DRAW"
}
