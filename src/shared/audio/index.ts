import type { NotificationType } from "@/shared/types/notifications"
import {
  ACHIEVEMENT_CHEST_CHIME,
  ACHIEVEMENT_SPARKLE_CHIME,
  accumulationChime,
  CORRECT_CHIME,
  OPPONENT_CHIME,
  SUCCESS_CHIME,
  TIMEOUT_CHIME,
  WRONG_CHIME,
  countdownTickChime,
  notificationChime,
  resultChime,
  waitTickChime,
  type DuelResultOutcome,
} from "./chimes"
import { playChime } from "./engine"

export * from "./chimes"
export { playChime, stopChimes } from "./engine"

/** Notification reçue : motif selon le type (générique pour les suivis et défis reçus). */
export function playNotificationChime(type?: NotificationType | null): void {
  playChime(notificationChime(type))
}

/** Bonne réponse en duel. */
export function playCorrectChime(): void {
  playChime(CORRECT_CHIME)
}

/** Mauvaise réponse en duel. */
export function playWrongChime(): void {
  playChime(WRONG_CHIME)
}

/** L'adversaire vient de répondre (duel humain ou bot). */
export function playOpponentChime(): void {
  playChime(OPPONENT_CHIME)
}

/** Temps écoulé sans réponse en duel. */
export function playTimeoutChime(): void {
  playChime(TIMEOUT_CHIME)
}

/** Accumulation de points/XP : salve de ticks montants (arène et anneau de la page résultat). */
export function playAccumulationChime(count: number, durationMs: number): void {
  playChime(accumulationChime(count, durationMs))
}

/** Tic-tac d'un écran à countdown (une seconde restante par appel). */
export function playCountdownTick(secondsLeft: number, tense = true): void {
  playChime(countdownTickChime(secondsLeft, tense))
}

/** Tic-tac d'attente (salon) : `index` incrémente à chaque tic. */
export function playWaitTick(index: number): void {
  playChime(waitTickChime(index))
}

/** Fin de duel : victoire, défaite ou égalité. */
export function playResultChime(outcome: DuelResultOutcome): void {
  playChime(resultChime(outcome))
}

/** Anti-superposition du « ding » de succès (sauvegardes de réglages champ par champ). */
const SUCCESS_COOLDOWN_MS = 600
let lastSuccessAt = 0

/**
 * Déblocage célébré : **fanfare « ouverture de coffre »** pour le premier, scintillement court
 * pour les suivants (file de célébrations). Un seul jingle par série de déblocages.
 */
export function playAchievementChime(first: boolean): void {
  playChime(first ? ACHIEVEMENT_CHEST_CHIME : ACHIEVEMENT_SPARKLE_CHIME)
}

/** Enregistrement/action réussis : « ding » discret (ignoré si un autre vient de sonner). */
export function playSuccessChime(): void {
  const now = Date.now()
  if (now - lastSuccessAt < SUCCESS_COOLDOWN_MS) return
  lastSuccessAt = now
  playChime(SUCCESS_CHIME)
}
