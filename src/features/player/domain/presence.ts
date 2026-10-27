/** État de présence d'un joueur (enum backend `PresenceStatus`). */
export type PresenceStatus = "ONLINE" | "OFFLINE"

/** Présence d'un joueur (`PresenceView`, REST et push WS). */
export interface Presence {
  userId: string
  status: PresenceStatus
  lastSeenAt: string | null
}

/** Un joueur est en ligne quand sa session temps réel est ouverte. */
export function isOnline(presence: Presence | null | undefined): boolean {
  return presence?.status === "ONLINE"
}

/**
 * Passage en ligne d'un joueur suivi — push **éphémère** du BFF sur
 * `/topic/follow-presence/{userId}` (jamais persisté, pas d'inbox). `pseudonym`/`avatarOptions`
 * peuvent manquer (profil indisponible) : repli sur l'identifiant côté client.
 */
export interface FollowPresence {
  actorId: string
  pseudonym: string | null
  avatarOptions: string | null
  at: string
}
