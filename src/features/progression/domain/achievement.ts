import type {
  BadgeFamily,
  BadgeMetric,
  Rank,
} from "./progression"

/** Type de déblocage célébré (`AchievementView.Kind` du BFF). */
export type AchievementKind = "BADGE" | "TITLE"

/**
 * Déblocage poussé en direct par le BFF (`/topic/achievements/{userId}`) : badge gagné ou titre
 * thématique débloqué. **Éphémère** (aucune persistance) : le client en fait une file de
 * célébrations, reportée tant qu'un écran immersif est affiché.
 *
 * <p>Le champ `tier` porte la rareté dans les deux cas : palier du badge ou palier de maîtrise
 * franchi dans le sujet.</p>
 */
export interface Achievement {
  kind: AchievementKind
  /** Badge : code du catalogue, libellé et famille. */
  code?: string | null
  label?: string | null
  family?: BadgeFamily | null
  /** Badge : palier du catalogue ; titre : palier de maîtrise franchi. */
  tier?: Rank | null
  /** Badge : métrique et cible de l'objectif qui a permis l'acquisition. */
  metric?: BadgeMetric | null
  target?: number | null
  /** Titre thématique : sujet débloqué. */
  topicId?: string | null
  at: string
}

/** Clé d'unicité d'un déblocage (dédoublonnage : rediffusion à la reconnexion STOMP). */
export function achievementKey(achievement: Achievement): string {
  return [
    achievement.kind,
    achievement.code ?? "",
    achievement.topicId ?? "",
    achievement.tier ?? "",
  ].join(":")
}
