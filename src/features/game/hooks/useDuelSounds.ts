import { useEffect, useRef, useState } from "react"
import {
  playAccumulationChime,
  playCorrectChime,
  playOpponentChime,
  playTimeoutChime,
  playWrongChime,
  stopChimes,
} from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import {
  ARENA_ACCUMULATION_DELAY_MS,
  arenaAccumulationTicks,
} from "../domain/accumulation"
import { SCORE_REVEAL_MS } from "../domain/game-constants"
import type { ArenaScene } from "../domain/arena-timeline"

export interface DuelSoundsParams {
  /** Scène projetée de l'arène (seul le type de scène pilote le son). */
  scene: Pick<ArenaScene, "kind">
  roundIndex: number
  /** Résultat de ma réponse (écho `PLAYER_ANSWERED`), `null` tant qu'inconnu. */
  yourCorrect: boolean | null
  /** Ma sélection sur le round courant (`null` = je n'ai pas répondu). */
  yourPick: string | null
  /** Sélection de l'adversaire sur le round courant (`null` = pas encore répondu). */
  theirPick: string | null
  /** Points gagnés sur le round (`0` tant qu'aucune réponse n'est enregistrée). */
  yourGain: number
}

/**
 * Sons de l'arène : **une réaction par round et par événement**, jamais rejouée.
 * - mes réponses : bonne/mauvaise dès l'écho serveur (`yourCorrect`), son neutre au reveal
 *   quand je n'ai pas répondu ;
 * - **accumulation de points** : à une bonne réponse, le « ding » part immédiatement puis la
 *   salve de ticks (`playAccumulationChime`) démarre `ARENA_ACCUMULATION_DELAY_MS` plus tard,
 *   sur le compteur de score — annulée si l'on quitte l'arène avant (même motif que l'anneau de
 *   la page résultat) ;
 * - adversaire : blip discret quand sa réponse arrive **en phase de réponse** (humain ou bot) —
 *   silencieux si l'écho tombe pendant le reveal (tout y est déjà visible) ;
 * - dédup stricte par round (scène re-projetée ~50 ms, historique rejoué) ;
 * - un état déjà terminal au montage (rechargement/reconnexion) ne sonne jamais.
 */
export function useDuelSounds({
  scene,
  roundIndex,
  yourCorrect,
  yourPick,
  theirPick,
  yourGain,
}: DuelSoundsParams): void {
  const enabled = useSoundStore((s) => s.enabled)
  // Rounds déjà sonorisés ; au montage, un état « déjà dû » (rechargement en plein round) est
  // marqué comme joué : seules les transitions observées en direct sonnent.
  const [playedRounds] = useState(() => {
    const alreadyDue =
      yourCorrect != null || scene.kind === "reveal" || scene.kind === "result"
    return new Set<number>(alreadyDue ? [roundIndex] : [])
  })
  const [announcedOpponentRounds] = useState(
    () => new Set<number>(theirPick != null ? [roundIndex] : [])
  )
  const accumulationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Quitter l'écran (navigation) coupe net les notes déjà planifiées : ceinture en plus du
  // changement de route (`useStopSoundsOnNavigate`).
  useEffect(() => stopChimes, [])

  // Quitter l'arène (fin de partie, abandon) annule la salve encore en attente.
  useEffect(
    () => () => {
      if (accumulationTimer.current != null)
        clearTimeout(accumulationTimer.current)
    },
    []
  )

  useEffect(() => {
    if (!enabled || playedRounds.has(roundIndex)) return
    if (yourCorrect === true) {
      playedRounds.add(roundIndex)
      playCorrectChime()
      const ticks = arenaAccumulationTicks(yourGain)
      if (ticks > 0) {
        accumulationTimer.current = setTimeout(() => {
          accumulationTimer.current = null
          // La salve occupe le reste de la montée de la jauge (après le « ding »).
          playAccumulationChime(
            ticks,
            SCORE_REVEAL_MS - ARENA_ACCUMULATION_DELAY_MS
          )
        }, ARENA_ACCUMULATION_DELAY_MS)
      }
      return
    }
    if (yourCorrect === false) {
      playedRounds.add(roundIndex)
      playWrongChime()
      return
    }
    // Non-réponse : le son neutre accompagne le reveal (jamais pendant la question).
    if (scene.kind === "reveal" && yourPick == null) {
      playedRounds.add(roundIndex)
      playTimeoutChime()
    }
  }, [
    enabled,
    playedRounds,
    roundIndex,
    yourCorrect,
    yourPick,
    yourGain,
    scene.kind,
  ])

  useEffect(() => {
    if (!enabled || announcedOpponentRounds.has(roundIndex)) return
    if (theirPick == null) return
    announcedOpponentRounds.add(roundIndex)
    // Écho pendant le reveal : tout y est déjà visible, pas de blip rétroactif.
    if (scene.kind === "question") playOpponentChime()
  }, [enabled, announcedOpponentRounds, roundIndex, theirPick, scene.kind])
}
