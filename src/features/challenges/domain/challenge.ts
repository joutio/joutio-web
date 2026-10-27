import type { TopicRef } from "@/features/topics/domain/topic"
import type { UserRef } from "@/features/player/domain/profile"

/** Statut d'un défi nominatif (enum backend `ChallengeStatus`). */
export type ChallengeStatus =
  "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "EXPIRED"

/**
 * Défi nominatif (intention asynchrone, TTL 1 h). À l'acceptation, la salle temps réel est
 * créée par la saga et `roomId` apparaît. `gameId` référence la partie terminée d'origine d'une
 * revanche (`null` pour un défi normal) — jamais la future partie.
 */
export interface ChallengeView {
  challengeId: string
  topic: TopicRef
  challenger: UserRef | null
  opponent: UserRef | null
  status: ChallengeStatus
  roomId: string | null
  gameId: string | null
  createdAt: string
  expiresAt: string
}
