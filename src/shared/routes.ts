/**
 * URLs de `design/specs/platforms/web.md` § 2. Le BFF n'expose pas encore de slug de sujet : la fiche sujet
 * s'adresse par son identifiant (`/topics/{topicId}`) jusqu'à ce qu'il en expose un.
 */
export const ROUTES = {
  home: '/',
  topics: '/topics',
  topic: (topicId: string) => `/topics/${encodeURIComponent(topicId)}`,
  topicLeaderboard: (topicId: string) => `/topics/${encodeURIComponent(topicId)}/leaderboard`,
  myGames: (topicId?: string) => (topicId ? `/me/games?topicId=${encodeURIComponent(topicId)}` : '/me/games'),
  result: (gameId: string) => `/games/${encodeURIComponent(gameId)}/result`,
  game: (gameId: string) => `/games/${encodeURIComponent(gameId)}`,
  /** Salon de préparation : absent de `web.md` § 2, aligné sur l'API (`/api/rooms/{id}`). */
  room: (roomId: string) => `/rooms/${encodeURIComponent(roomId)}`,
  /** Matchmaking (`web.md` § 2 : `/play`), le ticket en paramètre. */
  play: (ticketId: string) => `/play?ticket=${encodeURIComponent(ticketId)}`,
  join: (roomId: string) => `/join/${encodeURIComponent(roomId)}`,
  challenges: '/challenges',
  premium: '/premium',
  notifications: '/notifications',
  search: '/search',
} as const
