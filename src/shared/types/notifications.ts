/**
 * Contrat d'événement **transverse** back/front (isomorphe) : enveloppe des notifications temps
 * réel (WebSocket) et de leur historique REST.
 *
 * {@link EventEnvelopeResponse} porte les métadonnées d'ordre issues de l'événement Axon
 * (`sequenceNumber` garantit l'ordre et la déduplication du fold client) ; les contrats propres
 * à une feature vivent dans le `domain/` de celle-ci (`game-notification.ts`,
 * `room-notification.ts`, `matchmaking-notification.ts`).
 */

export interface EventEnvelopeResponse<T> {
  aggregateId: string
  sequenceNumber: number
  timestamp: string
  eventType: string
  payload: T
}

/* ───────────────────── Notifications personnelles ─────────────────── */

/** Type d'une notification d'inbox (contrat BFF `NotificationView`). */
export type NotificationType =
  | "FOLLOW"
  | "CHALLENGE_RECEIVED"
  | "CHALLENGE_DECLINED"
  | "ROOM_ACCEPTED"
  | "WIZZ"
  | "QUESTION_REPORTED"
  | "TOPIC_DRAFTED"
  | "ACCOUNT_SUSPENDED"

/** Vue d'une notification personnelle (REST + push `/topic/notifications/{userId}`). */
export interface NotificationView {
  notificationId: string
  type: NotificationType
  actorId: string | null
  sourceId: string | null
  topicId: string | null
  gameId: string | null
  expiresAt: string | null
  readAt: string | null
  createdAt: string
  /** Acteur suspendu au moment de la lecture (badge public). */
  actorSuspended?: boolean
}

/** Payload du push WS `NOTIFICATION_DELETED` : l'inbox retire la ligne et le compteur. */
export interface NotificationDeletedPayload {
  notificationId: string
}

export type NotificationCategory = "FOLLOW" | "ROOM" | "QUESTION" | "ACCOUNT"

export interface NotificationPreferenceView {
  category: NotificationCategory
  enabled: boolean
}
