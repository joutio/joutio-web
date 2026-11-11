/**
 * URLs de `design/specs/platforms/web.md` § 2. Le BFF n'expose pas encore de slug de sujet : la fiche sujet
 * s'adresse par son identifiant (`/topics/{topicId}`) jusqu'à ce qu'il en expose un.
 */
export const ROUTES = {
  home: '/',
  topics: '/topics',
  topic: (topicId: string) => `/topics/${encodeURIComponent(topicId)}`,
  notifications: '/notifications',
  search: '/search',
} as const
