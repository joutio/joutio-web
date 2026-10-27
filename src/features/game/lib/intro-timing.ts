import {
  ROUND_INTRO_MS,
  SWOOSH_DURATION_MS,
  VS_DURATION_MS,
} from "../domain/game-constants"

export type IntroStage = "vs" | "swoosh" | "done"

export interface IntroPlan {
  stage: IntroStage
  vsMs: number
  swooshMs: number
}

/**
 * Plan d'intro recalculé sur l'horloge serveur.
 *
 * Le budget serveur entre le lancement et le premier round est
 * `MATCH_INTRO_MS = VS + swoosh + intro de tour`. Si le client est en retard (notifications
 * tardives, rechargement en pleine partie), on compresse/saute les animations pour rejoindre
 * l'état courant sans pénaliser l'utilisateur. `remainingMs === null` ⇒ budget inconnu,
 * intro complète.
 */
export function planIntro(remainingMs: number | null): IntroPlan {
  if (remainingMs == null) {
    return { stage: "vs", vsMs: VS_DURATION_MS, swooshMs: SWOOSH_DURATION_MS }
  }
  if (remainingMs <= ROUND_INTRO_MS) {
    return { stage: "done", vsMs: 0, swooshMs: 0 }
  }
  if (remainingMs <= ROUND_INTRO_MS + SWOOSH_DURATION_MS) {
    return { stage: "swoosh", vsMs: 0, swooshMs: remainingMs - ROUND_INTRO_MS }
  }
  return {
    stage: "vs",
    vsMs: Math.min(
      VS_DURATION_MS,
      remainingMs - ROUND_INTRO_MS - SWOOSH_DURATION_MS
    ),
    swooshMs: SWOOSH_DURATION_MS,
  }
}
