import { ANSWER_REVEAL_STAGGER_MS } from "./game-constants"

/**
 * Règles pures du son d'**accumulation de points** (arène) et d'**XP** (anneau de maîtrise de la
 * page résultat) : combien de ticks jouer pour un montant donné. Le motif lui-même vit dans
 * `shared/audio/chimes.ts` (durée, hauteur, bornage). La salve **couvre l'animation** à laquelle
 * elle s'accroche (jauge de duel `SCORE_REVEAL_MS`, anneau `RING_REVEAL_MS`) : c'est le nombre de
 * ticks qui suit le montant gagné, pas la longueur du son.
 */

/** Nombre de ticks minimum : en dessous, ce n'est plus une accumulation mais un « ding ». */
export const ACCUMULATION_MIN_TICKS = 3
/** Bornes par usage : ~0,84 s pour la jauge de duel (0,9 s), ~1,54 s pour l'anneau (1,6 s). */
export const ARENA_ACCUMULATION_MAX_TICKS = 12
export const RING_ACCUMULATION_MAX_TICKS = 22
/** Points du round par tick (barème : 10–20 pts, 20–40 en question bonus). */
export const ARENA_POINTS_PER_TICK = 2
/** XP gagnée par tick (une partie rapporte quelques dizaines d'XP). */
export const RING_XP_PER_TICK = 6
/** `prefers-reduced-motion` : anneau posé d'un coup → motif court unique (anneau et arène). */
export const REDUCED_MOTION_TICKS = 3
/** Durée (ms) de la salve courte ci-dessus : un court « ta-da », sans animation à couvrir. */
export const REDUCED_MOTION_SALVE_MS = 240

/**
 * Délai (ms) entre le « ding » de bonne réponse et la salve d'accumulation : les deux jouent au
 * même instant (l'écho `PLAYER_ANSWERED` porte le score **et** la justesse) — on réutilise le
 * décalage du reveal des réponses pour que le motif reste lisible.
 */
export const ARENA_ACCUMULATION_DELAY_MS = ANSWER_REVEAL_STAGGER_MS

/** Nombre de ticks pour un montant : 0 (silence) si rien n'est gagné, sinon borné à `[min, max]`. */
export function accumulationTicks(
  amount: number,
  perTick: number,
  max: number
): number {
  if (!Number.isFinite(amount) || amount <= 0 || perTick <= 0) return 0
  return Math.max(
    ACCUMULATION_MIN_TICKS,
    Math.min(max, Math.ceil(amount / perTick))
  )
}

/** Ticks de la salve de l'arène (points du round). */
export const arenaAccumulationTicks = (points: number): number =>
  accumulationTicks(points, ARENA_POINTS_PER_TICK, ARENA_ACCUMULATION_MAX_TICKS)

/** Ticks de la salve de l'anneau de maîtrise (XP gagnée sur le duel). */
export const ringAccumulationTicks = (xp: number): number =>
  accumulationTicks(xp, RING_XP_PER_TICK, RING_ACCUMULATION_MAX_TICKS)
