/**
 * Clés React Query, centralisées : les invalidations déclenchées par le temps réel visent ces clés, jamais une chaîne
 * écrite à la main. Chaque feature ajoute ses clés ici en arrivant (web-kit § 4).
 */
export const queryKeys = {
  me: ['me'] as const,
  /** Horloge du serveur (`/api/clock`). */
  serverTime: ['server-time'] as const,
  /** Palette ⌘K et recherche globale. */
  suggestions: {
    term: (term: string) => ['suggestions', term] as const,
    players: (query: string) => ['suggestions', 'players', query] as const,
  },
  pseudonymAvailability: (value: string) => ['me', 'pseudonym-availability', value.toLowerCase()] as const,
  home: ['home'] as const,
  topics: {
    all: ['topics'] as const,
    /** Toutes les pages du catalogue, quel que soit le filtre. */
    lists: ['topics', 'list'] as const,
    list: (filters: object) => ['topics', 'list', filters] as const,
    facets: (query: string, scope: string) => ['topics', 'facets', query, { scope }] as const,
  },
  topic: {
    all: (topicId: string) => ['topic', topicId] as const,
    overview: (topicId: string) => ['topic', topicId, 'overview'] as const,
    leaderboard: (topicId: string) => ['topic', topicId, 'leaderboard'] as const,
    board: (topicId: string, filters: object) => ['topic', topicId, 'board', filters] as const,
    games: (topicId: string, userId: string) => ['topic', topicId, 'games', userId] as const,
  },
  profiles: {
    /** Tout ce qui concerne un joueur (profil, titres, badges, parties…). */
    all: (userId: string) => ['profiles', userId] as const,
    activity: (userId: string) => ['profiles', userId, 'activity'] as const,
    titles: (userId: string) => ['profiles', userId, 'titles'] as const,
    badges: (userId: string) => ['profiles', userId, 'badges'] as const,
    topics: (userId: string) => ['profiles', userId, 'topics'] as const,
    recentGames: (userId: string) => ['profiles', userId, 'games', 'recent'] as const,
    games: (userId: string, filters: object) => ['profiles', userId, 'games', filters] as const,
    profile: (userId: string) => ['profiles', userId, 'profile'] as const,
    headToHead: (userId: string, against: string) => ['profiles', userId, 'head-to-head', against] as const,
  },
  rewards: ['me', 'rewards'] as const,
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  /** Défis nominatifs du joueur (reçus et envoyés). */
  challenges: ['challenges', 'mine'] as const,
  /** Salons du joueur (`/api/rooms/mine`) : une seule requête pour Défis, la pastille et « Reprendre une partie ». */
  myRooms: ['rooms', 'mine'] as const,
  /** Un salon (`/api/rooms/{id}`). */
  room: (roomId: string) => ['rooms', 'room', roomId] as const,
  games: {
    /** Toutes les listes de parties en cours (préfixe). */
    activeAll: ['games', 'active'] as const,
    /** Parties en cours du joueur (`/api/games?active=true`). */
    active: (userId: string) => ['games', 'active', userId] as const,
    result: (gameId: string) => ['games', gameId, 'result'] as const,
    notifications: (gameId: string) => ['games', gameId, 'notifications'] as const,
    streakUnlock: (gameId: string) => ['games', gameId, 'streak-unlock'] as const,
  },
  /** Abonnements / abonnés d'un joueur, par recherche et tri. */
  contacts: {
    all: ['contacts'] as const,
    list: (userId: string, direction: 'following' | 'followers', query: string, sort: string) => ['contacts', userId, direction, query, sort] as const,
  },
  /** Atelier de création (`creation.md`). */
  workshop: {
    all: ['workshop'] as const,
    topics: ['workshop', 'topics'] as const,
    created: ['workshop', 'created'] as const,
    todo: ['workshop', 'todo'] as const,
    topic: (topicId: string) => ['workshop', topicId, 'workshop'] as const,
    questions: (topicId: string) => ['workshop', topicId, 'questions'] as const,
    reports: (topicId: string) => ['workshop', topicId, 'reports'] as const,
    team: (topicId: string) => ['workshop', topicId, 'team'] as const,
    /** Sujets publiés au nom proche, pour l'avertissement de doublon de « Nouveau sujet ». */
    named: (query: string) => ['workshop', 'named', query] as const,
  },
  onboarding: {
    recommendations: (interests: readonly string[]) => ['onboarding', 'recommendations', [...interests]] as const,
  },
} as const
