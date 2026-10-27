import type { NotificationType } from "@/shared/types/notifications"

/** Note d'un motif sonore : fréquence (Hz), décalage et durée (s), gain crête (0–1). */
export interface ChimeNote {
  frequency: number
  offset: number
  duration: number
  gain: number
  /** Forme d'onde (défaut `sine`) : `triangle` pour un corps plus boisé sur les percussions. */
  type?: OscillatorType
}

/** Motif sonore : suite de notes jouées par `playChime` (offsets croissants). */
export type Chime = readonly ChimeNote[]

/** Issue sportive d'une partie terminée (son de fin de duel). */
export type DuelResultOutcome = "win" | "loss" | "draw"

/** Notification générique — trois notes montantes courtes, esprit « Tri-tone » iOS. */
export const NOTIFICATION_CHIME: Chime = [
  { frequency: 1046.5, offset: 0, duration: 0.16, gain: 0.14 },
  { frequency: 1318.51, offset: 0.085, duration: 0.16, gain: 0.13 },
  { frequency: 1567.98, offset: 0.17, duration: 0.28, gain: 0.12 },
]

/** Défi accepté — montée lumineuse, plus ample qu'une notification générique. */
export const NOTIFICATION_ACCEPTED_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.12, gain: 0.13 },
  { frequency: 1046.5, offset: 0.07, duration: 0.12, gain: 0.13 },
  { frequency: 1318.51, offset: 0.14, duration: 0.24, gain: 0.12 },
]

/** Défi refusé — descente douce, non punitive. */
export const NOTIFICATION_DECLINED_CHIME: Chime = [
  { frequency: 659.26, offset: 0, duration: 0.16, gain: 0.12 },
  { frequency: 523.25, offset: 0.1, duration: 0.26, gain: 0.11 },
]

/**
 * Relance (« wizz ») — double « nudge » percussif (aigu → grave, répété), nettement détaché de
 * la notification générique : la secousse d'écran qui l'accompagne porte le reste de l'effet.
 */
export const WIZZ_CHIME: Chime = [
  { frequency: 1567.98, offset: 0, duration: 0.07, gain: 0.15 },
  { frequency: 783.99, offset: 0.075, duration: 0.1, gain: 0.14 },
  { frequency: 1318.51, offset: 0.18, duration: 0.07, gain: 0.14 },
  { frequency: 659.26, offset: 0.255, duration: 0.24, gain: 0.13 },
]

/** Bonne réponse en duel — montée claire. */
export const CORRECT_CHIME: Chime = [
  { frequency: 1318.51, offset: 0, duration: 0.12, gain: 0.14 },
  { frequency: 1975.53, offset: 0.08, duration: 0.26, gain: 0.13 },
]

/** Mauvaise réponse en duel — descente douce. */
export const WRONG_CHIME: Chime = [
  { frequency: 440, offset: 0, duration: 0.14, gain: 0.13 },
  { frequency: 329.63, offset: 0.09, duration: 0.26, gain: 0.12 },
]

/** Temps écoulé sans réponse — neutre et discret (ni correct, ni faux). */
export const TIMEOUT_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.18, gain: 0.11 },
  { frequency: 587.33, offset: 0.14, duration: 0.3, gain: 0.1 },
]

/** L'adversaire a répondu — double blip neutre, discret (ni bien, ni mal). */
export const OPPONENT_CHIME: Chime = [
  { frequency: 880, offset: 0, duration: 0.06, gain: 0.11 },
  { frequency: 880, offset: 0.07, duration: 0.14, gain: 0.1 },
]

/** Victoire — arpège majeur montant. */
export const VICTORY_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.14, gain: 0.13 },
  { frequency: 1046.5, offset: 0.09, duration: 0.14, gain: 0.13 },
  { frequency: 1318.51, offset: 0.18, duration: 0.14, gain: 0.13 },
  { frequency: 1567.98, offset: 0.27, duration: 0.36, gain: 0.12 },
]

/**
 * Défaite — descente mineure, sobre. Registre **volontairement aigu** (392–587 Hz + octave) :
 * un motif grave sous ~400 Hz est quasi inaudible sur les haut-parleurs d'un portable ou d'un
 * téléphone, alors que la victoire (784–1568 Hz) passe sans problème — d'où une défaite muette
 * en apparence. Les harmoniques à l'octave (gain faible) donnent du corps sans changer la
 * descente.
 */
export const DEFEAT_CHIME: Chime = [
  { frequency: 587.33, offset: 0, duration: 0.18, gain: 0.13 },
  { frequency: 1174.66, offset: 0, duration: 0.1, gain: 0.05 },
  { frequency: 493.88, offset: 0.12, duration: 0.18, gain: 0.13 },
  { frequency: 987.77, offset: 0.12, duration: 0.1, gain: 0.05 },
  { frequency: 392, offset: 0.24, duration: 0.4, gain: 0.12 },
  { frequency: 783.99, offset: 0.24, duration: 0.3, gain: 0.05 },
]

/** Égalité — quinte neutre. */
export const DRAW_CHIME: Chime = [
  { frequency: 783.99, offset: 0, duration: 0.18, gain: 0.12 },
  { frequency: 1174.66, offset: 0.12, duration: 0.32, gain: 0.11 },
]

/**
 * Déblocage (badge, titre) — **fanfare « ouverture de coffre »** : le « thud » du
 * couvercle, un arpège montant (C5 → E6) puis un scintillement qui traîne (C7/E7), esprit
 * item-get des jeux de récompense. Motif **original** (aucune reprise d'une composition
 * existante), écrit pour le moteur d'oscillateurs de l'app.
 */
export const ACHIEVEMENT_CHEST_CHIME: Chime = [
  { frequency: 130.81, offset: 0, duration: 0.18, gain: 0.1 },
  { frequency: 261.63, offset: 0, duration: 0.1, gain: 0.05 },
  { frequency: 523.25, offset: 0.1, duration: 0.12, gain: 0.12 },
  { frequency: 659.26, offset: 0.16, duration: 0.12, gain: 0.12 },
  { frequency: 783.99, offset: 0.22, duration: 0.12, gain: 0.12 },
  { frequency: 1046.5, offset: 0.28, duration: 0.14, gain: 0.13 },
  { frequency: 1318.51, offset: 0.34, duration: 0.16, gain: 0.13 },
  { frequency: 1567.98, offset: 0.4, duration: 0.6, gain: 0.08 },
  { frequency: 2093.0, offset: 0.4, duration: 0.55, gain: 0.09 },
  { frequency: 2637.02, offset: 0.46, duration: 0.75, gain: 0.06 },
]

/** Déblocage **suivant** de la file — scintillement court (le coffre est déjà ouvert). */
export const ACHIEVEMENT_SPARKLE_CHIME: Chime = [
  { frequency: 1046.5, offset: 0, duration: 0.1, gain: 0.11 },
  { frequency: 1567.98, offset: 0.06, duration: 0.12, gain: 0.11 },
  { frequency: 2093.0, offset: 0.12, duration: 0.24, gain: 0.09 },
]

/** Enregistrement/action réussis — « ding » discret. */
export const SUCCESS_CHIME: Chime = [
  { frequency: 1046.5, offset: 0, duration: 0.1, gain: 0.13 },
  { frequency: 1318.51, offset: 0.055, duration: 0.16, gain: 0.12 },
]

/** Nombre de ticks minimum (un motif doit avoir au moins deux notes). */
const ACCUMULATION_MIN_TICKS = 2
/** Nombre de ticks maximum (24 × 70 ms ≈ 1,7 s : salve d'accumulation de l'anneau de résultat). */
const ACCUMULATION_MAX_TICKS = 24
const ACCUMULATION_TICK_DURATION_S = 0.045
/** Gain sous celui du « ding » de bonne réponse (0,14) : l'accumulation ne le masque pas. */
const ACCUMULATION_TICK_GAIN = 0.11
const ACCUMULATION_BASE_FREQUENCY = 880
const SEMITONE_RATIO = 2 ** (1 / 12)
/**
 * La salve grimpe **toujours d'une octave** sur sa longueur, quel que soit le nombre de ticks :
 * défaite comme victoire, petit comme gros gain, elle a la même identité sonore (mêmes bornes de
 * hauteur) — seule la **densité** des ticks suit le montant gagné et la durée de l'animation.
 */
const ACCUMULATION_CLIMB_SEMITONES = 12

/**
 * Salve d'accumulation : `count` ticks très courts dont la hauteur monte d'un demi-ton par pas
 * (sensation de compteur qui grimpe), **répartis régulièrement sur `durationMs`** — la durée de
 * l'animation qu'ils accompagnent (jauge du duel, anneau de résultat, toutes deux linéaires).
 *
 * Règle : le son **couvre toute l'animation**, et c'est le **nombre** de ticks qui suit le
 * montant gagné — gros gain = salve dense, petit gain = ticks espacés (jamais de silence en fin
 * d'animation). Le bornage garantit ≥ 2 notes et 24 ticks maximum.
 */
export function accumulationChime(count: number, durationMs: number): Chime {
  const ticks = Number.isFinite(count)
    ? Math.max(
        ACCUMULATION_MIN_TICKS,
        Math.min(ACCUMULATION_MAX_TICKS, Math.round(count))
      )
    : ACCUMULATION_MIN_TICKS
  const duration = Math.max(0, durationMs) / 1000
  const step = ACCUMULATION_CLIMB_SEMITONES / Math.max(1, ticks - 1)

  return Array.from({ length: ticks }, (_, index) => ({
    frequency: ACCUMULATION_BASE_FREQUENCY * SEMITONE_RATIO ** (index * step),
    offset: (duration * (index + 0.5)) / ticks,
    duration: ACCUMULATION_TICK_DURATION_S,
    gain: ACCUMULATION_TICK_GAIN,
  }))
}

/**
 * Tic-tac des écrans à countdown : un tic par seconde, hauteur alternée (tic aigu / tac grave),
 * corps triangulaire et harmoniques brèves pour un « clic » plus charnu qu'un simple bip.
 * Fenêtre de tension : chaque tic des `COUNTDOWN_TENSE_SECONDS` dernières secondes monte d'un
 * demi-ton — la **cadence** et la **durée** ne changent pas. `tense: false` conserve la hauteur
 * d'origine (appariement, où la recherche de 10 s ne doit pas s'accélérer).
 */
export const COUNTDOWN_TENSE_SECONDS = 3
const COUNTDOWN_TIC_FREQUENCY = 1174.66
const COUNTDOWN_TAC_FREQUENCY = 880
const COUNTDOWN_TICK_GAIN = 0.075
const COUNTDOWN_TICK_BODY_GAIN = 0.025
const COUNTDOWN_TICK_HARMONIC_GAIN = 0.032
const COUNTDOWN_TICK_DURATION_S = 0.07
const COUNTDOWN_TICK_BODY_DURATION_S = 0.11
const COUNTDOWN_TICK_HARMONIC_DURATION_S = 0.024

/** Tic (pas impair) ou tac (pas pair), décalé de `tension` demi-tons. */
function tickChime(step: number, tension: number): Chime {
  const base =
    (Math.abs(Math.round(step)) % 2 === 1
      ? COUNTDOWN_TIC_FREQUENCY
      : COUNTDOWN_TAC_FREQUENCY) *
    SEMITONE_RATIO ** Math.max(0, tension)

  return [
    {
      frequency: base,
      offset: 0,
      duration: COUNTDOWN_TICK_DURATION_S,
      gain: COUNTDOWN_TICK_GAIN,
      type: "triangle",
    },
    {
      frequency: base * 2,
      offset: 0,
      duration: COUNTDOWN_TICK_HARMONIC_DURATION_S,
      gain: COUNTDOWN_TICK_HARMONIC_GAIN,
    },
    {
      // Corps grave très court : donne du poids au clic sans masquer le tic aigu.
      frequency: base / 2,
      offset: 0.006,
      duration: COUNTDOWN_TICK_BODY_DURATION_S,
      gain: COUNTDOWN_TICK_BODY_GAIN,
    },
  ]
}

/**
 * Tic (ou tac) d'une seconde restante ; `secondsLeft` ≤ 0 = dernière seconde passée.
 * `tense: false` garde une hauteur constante (matchmaking) au lieu de monter sur la fin.
 */
export function countdownTickChime(secondsLeft: number, tense = true): Chime {
  const seconds = Math.max(0, Math.ceil(secondsLeft))
  return tickChime(
    seconds,
    tense ? Math.max(0, COUNTDOWN_TENSE_SECONDS - seconds + 1) : 0
  )
}

/**
 * Tic-tac d'**attente** (salon, en continu) : alternance tic/tac **sans tension** — aucune
 * échéance proche à annoncer. `index` incrémente d'un tic à l'autre (l'alternance reste juste).
 */
export function waitTickChime(index: number): Chime {
  return tickChime(index, 0)
}

/** Motif du bilan sportif associé à une issue (victoire, défaite, égalité). */
export function resultChime(outcome: DuelResultOutcome): Chime {
  if (outcome === "win") return VICTORY_CHIME
  if (outcome === "loss") return DEFEAT_CHIME
  return DRAW_CHIME
}

/** Motif d'une notification selon son type : générique pour les suivis et défis reçus. */
export function notificationChime(type?: NotificationType | null): Chime {
  switch (type) {
    case "ROOM_ACCEPTED":
      return NOTIFICATION_ACCEPTED_CHIME
    case "CHALLENGE_DECLINED":
      return NOTIFICATION_DECLINED_CHIME
    case "WIZZ":
      return WIZZ_CHIME
    default:
      return NOTIFICATION_CHIME
  }
}
