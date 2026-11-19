import { VS_DURATION_MS, type ArenaScene } from '@joutio/client/game'

/**
 * Temps écoulé depuis le début du face-à-face. `sceneAt` repart de 0 au swoosh, alors que la séquence animée couvre les
 * deux fenêtres : repartir de 0 relançait toute l'animation à mi-parcours (intro jouée deux fois, 2026-11-19).
 */
export function versusElapsedMs(scene: ArenaScene): number {
  if (scene.kind === 'vs') return scene.elapsedMs
  if (scene.kind === 'swoosh') return VS_DURATION_MS + scene.elapsedMs
  return 0
}
