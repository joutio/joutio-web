/**
 * Clés React Query, centralisées : les invalidations déclenchées par le temps réel visent ces clés, jamais une chaîne
 * écrite à la main. Chaque feature ajoute ses clés ici en arrivant (web-kit § 4).
 */
export const queryKeys = {
  me: ['me'] as const,
  home: ['home'] as const,
  topics: {
    list: (filters: object) => ['topics', 'list', filters] as const,
    facets: (query: string, followed: boolean) => ['topics', 'facets', query, { followed }] as const,
  },
  topic: {
    all: (topicId: string) => ['topic', topicId] as const,
    overview: (topicId: string) => ['topic', topicId, 'overview'] as const,
    leaderboard: (topicId: string) => ['topic', topicId, 'leaderboard'] as const,
    board: (topicId: string, filters: object) => ['topic', topicId, 'board', filters] as const,
    games: (topicId: string, userId: string) => ['topic', topicId, 'games', userId] as const,
  },
  profiles: {
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
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  onboarding: {
    recommendations: (interests: readonly string[]) => ['onboarding', 'recommendations', [...interests]] as const,
  },
} as const
