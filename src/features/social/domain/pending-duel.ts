import type { ChallengeView } from "@/features/challenges/domain/challenge"
import type { RoomView } from "@/features/rooms/domain/room"

/**
 * Élément en attente d'action affiché sur la page Défis & Salons : défi reçu (invité), défi envoyé
 * (lanceur) ou salon ouvert. Contrat pur — aucune dépendance à une couche d'implémentation.
 */
export type PendingDuel =
  | {
      kind: "received"
      id: string
      topic: ChallengeView["topic"]
      player: ChallengeView["challenger"]
      expiresAt: string
      /** Défi de revanche : la partie d'origine est référencée (`gameId`). */
      rematch: boolean
    }
  | {
      kind: "sent"
      id: string
      topic: ChallengeView["topic"]
      player: ChallengeView["opponent"]
      expiresAt: string
      rematch: boolean
    }
  | {
      kind: "room"
      id: string
      topic: RoomView["topic"]
      player: RoomView["opponent"]
      /** Expiration de la salle (1 jour) — comme les défis, la carte affiche le compte à rebours. */
      expiresAt: string
      /** Seul l'initiateur peut annuler la salle. */
      canCancel: boolean
    }

/** Défi reçu (invité) — carte à accepter ou refuser. */
export type ReceivedDuel = Extract<PendingDuel, { kind: "received" }>

/** Types de cartes de la page « Défis & Salons », dans l'ordre d'affichage. */
export const PENDING_TYPES = ["received", "sent", "room"] as const
export type PendingType = (typeof PENDING_TYPES)[number]

/** Tous les types sont sélectionnés : filtre absent de l'URL. */
export function isAllPendingTypes(types: readonly PendingType[]): boolean {
  return types.length === PENDING_TYPES.length
}

/**
 * Types sélectionnés depuis `?type=` : liste séparée par des virgules (`received,sent`).
 * Une valeur absente, invalide ou `ALL` retombe sur tous les types.
 */
export function parsePendingTypes(raw: string): PendingType[] {
  const requested = new Set(raw.split(",").map((value) => value.trim()))
  if (requested.has("ALL")) return [...PENDING_TYPES]
  const selected = PENDING_TYPES.filter((type) => requested.has(type))
  return selected.length > 0 ? [...selected] : [...PENDING_TYPES]
}

/**
 * Ajoute ou retire un type. Depuis « Tous », un clic isole le type choisi ; retirer le dernier
 * type sélectionné revient à « Tous ».
 */
export function togglePendingType(
  current: readonly PendingType[],
  type: PendingType
): PendingType[] {
  if (isAllPendingTypes(current)) return [type]
  const selected = new Set(current)
  if (selected.has(type)) selected.delete(type)
  else selected.add(type)
  if (selected.size === 0) return [...PENDING_TYPES]
  return PENDING_TYPES.filter((item) => selected.has(item))
}

/** Tri par échéance des cartes en attente. */
export const PENDING_SORTS = ["EXPIRING", "LATEST"] as const
export type PendingSort = (typeof PENDING_SORTS)[number]

export function isPendingSort(value: string): value is PendingSort {
  return (PENDING_SORTS as readonly string[]).includes(value)
}

/**
 * Vrai tant que l'échéance serveur n'est pas dépassée. Les cartes expirées sont retirées de la
 * section Défis et de la pastille de navigation sans attendre le poll serveur.
 */
export function isPendingActive(
  item: Pick<PendingDuel, "expiresAt">,
  nowMs: number
): boolean {
  const expiresAt = Date.parse(item.expiresAt)
  return !Number.isFinite(expiresAt) || expiresAt > nowMs
}

/** Tri **stable** par échéance (la plus proche d'abord, ou la plus lointaine). */
export function sortPending<T extends PendingDuel>(
  items: T[],
  sort: PendingSort
): T[] {
  return [...items].sort((left, right) => {
    const byExpiry = left.expiresAt.localeCompare(right.expiresAt)
    return sort === "EXPIRING" ? byExpiry : -byExpiry
  })
}

/** Défis `PENDING` d'un joueur, scindés en invitations reçues et défis envoyés. */
export function splitPendingChallenges(
  challenges: ChallengeView[],
  me: string | null
): { received: ChallengeView[]; sent: ChallengeView[] } {
  const pending = challenges.filter(
    (challenge) => challenge.status === "PENDING"
  )
  return {
    received: pending.filter((challenge) => challenge.opponent?.userId === me),
    sent: pending.filter((challenge) => challenge.challenger?.userId === me),
  }
}

export function toReceivedDuel(challenge: ChallengeView): ReceivedDuel {
  return {
    kind: "received",
    id: challenge.challengeId,
    topic: challenge.topic,
    player: challenge.challenger,
    expiresAt: challenge.expiresAt,
    rematch: challenge.gameId !== null,
  }
}

export function toSentDuel(challenge: ChallengeView): PendingDuel {
  return {
    kind: "sent",
    id: challenge.challengeId,
    topic: challenge.topic,
    player: challenge.opponent,
    expiresAt: challenge.expiresAt,
    rematch: challenge.gameId !== null,
  }
}

export function toRoomDuel(room: RoomView): PendingDuel {
  return {
    kind: "room",
    id: room.roomId,
    topic: room.topic,
    player: room.opponent,
    expiresAt: room.expiresAt,
    canCancel: room.canCancel,
  }
}
