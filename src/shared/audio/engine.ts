import type { Chime } from "./chimes"

let context: AudioContext | null = null
/** Oscillateurs planifiés (un motif est entièrement armé d'avance) : coupés par `stopChimes`. */
const scheduled = new Set<OscillatorNode>()

function getAudioContext(): AudioContext | null {
  if (context) return context
  if (
    typeof window === "undefined" ||
    typeof window.AudioContext === "undefined"
  ) {
    return null
  }
  try {
    context = new window.AudioContext()
    return context
  } catch {
    return null
  }
}

/**
 * Joue un motif sonore (best-effort) : silencieux si l'API Web Audio est indisponible, reprise
 * du contexte `suspended` (politique d'autoplay), **aucune exception** ne remonte à l'appelant.
 * Un unique `AudioContext` est partagé par tous les sons.
 *
 * Les notes (motifs longs : salve d'accumulation, tic-tac, jingle) sont armées d'avance et
 * suivies dans `scheduled` : `stopChimes` les coupe net.
 */
export function playChime(chime: Chime): void {
  const audio = getAudioContext()
  if (!audio) return
  if (audio.state === "suspended") {
    void audio.resume().catch(() => undefined)
  }
  const start = audio.currentTime + 0.01
  for (const note of chime) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    const noteStart = start + note.offset
    const noteEnd = noteStart + note.duration
    oscillator.type = note.type ?? "sine"
    oscillator.frequency.value = note.frequency
    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(note.gain, noteStart + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd)
    oscillator.connect(gain)
    gain.connect(audio.destination)
    scheduled.add(oscillator)
    oscillator.onended = () => scheduled.delete(oscillator)
    oscillator.start(noteStart)
    oscillator.stop(noteEnd + 0.02)
  }
}

/**
 * Coupe **immédiatement** tous les sons en cours (notes déjà planifiées comprises). Appelé à
 * chaque changement de route (`useStopSoundsOnNavigate`) : quitter une page qui émettait un son
 * ne le laisse jamais traîner derrière soi.
 */
export function stopChimes(): void {
  for (const oscillator of scheduled) {
    try {
      oscillator.stop()
    } catch {
      // Déjà arrêté (note terminée) : rien à faire.
    }
    oscillator.disconnect()
  }
  scheduled.clear()
}
