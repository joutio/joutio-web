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
  profiles: {
    activity: (userId: string) => ['profiles', userId, 'activity'] as const,
  },
  notifications: {
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  onboarding: {
    recommendations: (interests: readonly string[]) => ['onboarding', 'recommendations', [...interests]] as const,
  },
} as const
