import type { ChallengeView } from '@joutio/client-domain/api-types'
import type { RoomView } from '@joutio/client-domain/rooms'
import { api } from '@/lib/api'

const id = encodeURIComponent

export const CHALLENGES_ENDPOINTS = {
  mine: '/api/challenges/mine',
  challenge: (challengeId: string) => `/api/challenges/${id(challengeId)}`,
  accept: (challengeId: string) => `/api/challenges/${id(challengeId)}/accept`,
  decline: (challengeId: string) => `/api/challenges/${id(challengeId)}/decline`,
  cancel: (challengeId: string) => `/api/challenges/${id(challengeId)}/cancel`,
  rooms: '/api/rooms/mine',
} as const

/** Défis nominatifs et salons du joueur (`defis.md` § 6). */
export const challengesService = {
  mine: () => api.get<ChallengeView[]>(CHALLENGES_ENDPOINTS.mine),
  get: (challengeId: string) => api.get<ChallengeView>(CHALLENGES_ENDPOINTS.challenge(challengeId)),
  rooms: () => api.get<RoomView[]>(CHALLENGES_ENDPOINTS.rooms),
  accept: (challengeId: string) => api.post<void>(CHALLENGES_ENDPOINTS.accept(challengeId)),
  decline: (challengeId: string) => api.post<void>(CHALLENGES_ENDPOINTS.decline(challengeId)),
  cancel: (challengeId: string) => api.post<void>(CHALLENGES_ENDPOINTS.cancel(challengeId)),
}

/** Reçus affichés dans « Tous » ; la liste complète est sous la puce Reçus, 10 par page. */
export const RECEIVED_PREVIEW = 3
export const RECEIVED_PAGE = 10

/** Défis en attente, répartis : reçus (échéance la plus proche d'abord) et envoyés (plus récents d'abord). */
export function splitChallenges(challenges: readonly ChallengeView[] | undefined, userId: string) {
  const pending = (challenges ?? []).filter((challenge) => challenge.status === 'PENDING')
  const received = pending.filter((challenge) => challenge.opponent.userId === userId).sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt))
  const sent = pending.filter((challenge) => challenge.challenger.userId === userId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  return { received, sent }
}

const CLOSED: readonly RoomView['status'][] = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED']

/** Salons humains encore ouverts : privés, défis acceptés et préparation en cours (jamais le robot). */
export const openRooms = (rooms: readonly RoomView[] | undefined) => (rooms ?? []).filter((room) => !room.vsBot && !CLOSED.includes(room.status))
