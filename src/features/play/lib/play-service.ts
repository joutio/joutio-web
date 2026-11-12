import type { IdResponse, PageResponse, PeopleSort, PlayerCardView, PlayerProfileView } from '@joutio/client-domain/api-types'
import type { BotDifficulty } from '@joutio/client-domain/game'
import type { MatchmakingNotification, MatchmakingTicket, RoomNotification, RoomView } from '@joutio/client-domain/rooms'
import { api } from '@/lib/api'
import type { EventEnvelope } from '@/lib/realtime'

const id = encodeURIComponent

export const PLAY_ENDPOINTS = {
  rooms: '/api/rooms',
  botRoom: '/api/rooms/bot',
  room: (roomId: string) => `/api/rooms/${id(roomId)}`,
  cancel: (roomId: string) => `/api/rooms/${id(roomId)}/cancel`,
  wizz: (roomId: string) => `/api/rooms/${id(roomId)}/wizz`,
  roomNotifications: (roomId: string) => `/api/rooms/${id(roomId)}/notifications`,
  roomTopic: (roomId: string) => `/topic/rooms/${roomId}`,
  /** Canal de présence : abonné = dans le salon. Le serveur observe l'abonnement, l'app ne déclare rien. */
  roomPresence: (roomId: string) => `/topic/rooms/${roomId}/presence`,
  /** Refus d'entrée dans un salon (salle pleine, non invité…), poussé au joueur. */
  roomPresenceErrors: '/user/queue/room-presence',
  tickets: '/api/matchmaking/tickets',
  cancelTicket: (ticketId: string) => `/api/matchmaking/tickets/${id(ticketId)}/cancel`,
  ticketNotifications: (ticketId: string) => `/api/matchmaking/tickets/${id(ticketId)}/notifications`,
  ticketTopic: (ticketId: string) => `/topic/matchmaking/tickets/${ticketId}`,
  /** Canal de présence du ticket : quitter l'écran ou perdre la connexion annule la recherche côté serveur. */
  ticketPresence: (ticketId: string) => `/topic/matchmaking/tickets/${ticketId}/presence`,
  challenges: '/api/challenges',
  myRooms: '/api/rooms/mine',
  contacts: (userId: string, direction: 'following' | 'followers') => `/api/profiles/${id(userId)}/${direction}`,
  autoTrain: (userId: string) => `/api/profiles/${id(userId)}/auto-train`,
  profile: (userId: string) => `/api/profiles/${id(userId)}`,
} as const

export const CONTACTS_PAGE_SIZE = 20

/**
 * Préparation d'une partie (`lancer-partie.md`, `matchmaking.md`) : la salle est l'unique point d'entrée (partagée,
 * bot, défi) ; le matchmaking public crée une salle à l'issue de la recherche.
 */
export const playService = {
  createRoom: (topicId: string) => api.post<IdResponse>(PLAY_ENDPOINTS.rooms, { topicId }),
  createBotRoom: (topicId: string, difficulty: BotDifficulty) => api.post<IdResponse>(PLAY_ENDPOINTS.botRoom, { topicId, difficulty }),
  room: (roomId: string) => api.get<RoomView>(PLAY_ENDPOINTS.room(roomId)),
  /** Mes salons : ceux à suivre pour le bandeau « Partie en cours ». */
  myRooms: () => api.get<RoomView[]>(PLAY_ENDPOINTS.myRooms),
  cancelRoom: (roomId: string) => api.post<void>(PLAY_ENDPOINTS.cancel(roomId)),
  /** Relance (« wizz ») de l'adversaire nommé absent : cadence de 10 s par joueur côté serveur. */
  wizzRoom: (roomId: string) => api.post<void>(PLAY_ENDPOINTS.wizz(roomId)),
  roomNotifications: (roomId: string) => api.get<EventEnvelope<RoomNotification>[]>(PLAY_ENDPOINTS.roomNotifications(roomId)),

  enqueue: (topicId: string) => api.post<MatchmakingTicket>(PLAY_ENDPOINTS.tickets, { topicId }),
  cancelTicket: (ticketId: string) => api.post<void>(PLAY_ENDPOINTS.cancelTicket(ticketId)),
  ticketNotifications: (ticketId: string) => api.get<EventEnvelope<MatchmakingNotification>[]>(PLAY_ENDPOINTS.ticketNotifications(ticketId)),

  /** Défi nominatif : crée une salle réservée à l'invité, qui l'accepte depuis ses Défis. */
  challenge: (topicId: string, opponentId: string) => api.post<IdResponse>(PLAY_ENDPOINTS.challenges, { topicId, opponentId }),

  contacts: (userId: string, direction: 'following' | 'followers', query: string, sort: PeopleSort, page: number) =>
    api.get<PageResponse<PlayerCardView>>(PLAY_ENDPOINTS.contacts(userId, direction), { query: { q: query || undefined, sort, page, size: CONTACTS_PAGE_SIZE } }),

  profile: (userId: string) => api.get<PlayerProfileView>(PLAY_ENDPOINTS.profile(userId)),

  setAutoTrain: (userId: string, enabled: boolean) => api.put<void>(PLAY_ENDPOINTS.autoTrain(userId), { enabled }),
}
