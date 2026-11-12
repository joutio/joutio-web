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
  /** Toutes les parties contre un joueur (`historique.md` § 2). */
  gamesAgainst: (opponentId: string) => `/me/games?opponentId=${encodeURIComponent(opponentId)}`,
  me: '/me',
  myTitles: '/me/titles',
  settings: '/me/settings',
  /** Création : Mes sujets et l'atelier (`web.md` § 2). */
  myTopics: '/me/topics',
  /** Série et Sujets joués : écrans poussés du Profil, absents de `web.md` § 2. */
  myStreak: '/me/streak',
  myPlayedTopics: '/me/played',
  /** Le BFF n'expose pas de slug de joueur : la fiche s'adresse par son identifiant. */
  player: (userId: string) => `/players/${encodeURIComponent(userId)}`,
  result: (gameId: string) => `/games/${encodeURIComponent(gameId)}/result`,
  game: (gameId: string) => `/games/${encodeURIComponent(gameId)}`,
  /** Salon de préparation : absent de `web.md` § 2, aligné sur l'API (`/api/rooms/{id}`). */
  room: (roomId: string) => `/rooms/${encodeURIComponent(roomId)}`,
  /** Matchmaking (`web.md` § 2 : `/play`), le ticket en paramètre. */
  play: (ticketId: string) => `/play?ticket=${encodeURIComponent(ticketId)}`,
  join: (roomId: string) => `/join/${encodeURIComponent(roomId)}`,
  social: '/social',
  challenges: '/challenges',
  premium: '/premium',
  notifications: '/notifications',
  search: '/search',
} as const
