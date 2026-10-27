import type {
  TopicFacetsParams,
  TopicLeaderboardParams,
  TopicListParams,
} from "@/features/topics/domain/topic"
import type {
  PeopleDirection,
  PeopleParams,
  ProfileGamesParams,
} from "@/features/player/domain/profile"

/**
 * Fabrique de clés de requête hiérarchiques (cache React Query) — une clé par ressource/vue.
 */
export const queryKeys = {
  me: () => ["me"] as const,
  meRewards: () => ["me", "rewards"] as const,
  home: () => ["home"] as const,
  onboarding: {
    recommendations: (interests: string[]) =>
      ["onboarding", "recommendations", interests] as const,
  },
  suggestions: (q: string, limit: number) => ["suggestions", q, limit] as const,
  serverTime: () => ["server-time"] as const,
  topics: {
    all: ["topics"] as const,
    list: (params: TopicListParams) => ["topics", "list", params] as const,
    facets: (params: TopicFacetsParams) =>
      ["topics", "facets", params] as const,
    categories: () => ["topics", "categories"] as const,
    overview: (topicId: string) => ["topics", "overview", topicId] as const,
    leaderboard: (topicId: string, params: TopicLeaderboardParams) =>
      ["topics", "leaderboard", topicId, params] as const,
    questions: (topicId: string, params: { page: number; size: number }) =>
      ["topics", "questions", topicId, params] as const,
  },
  profiles: {
    all: ["profiles"] as const,
    detail: (userId: string) => ["profiles", "detail", userId] as const,
    people: (
      userId: string,
      direction: PeopleDirection,
      params: PeopleParams
    ) => ["profiles", "people", userId, direction, params] as const,
    /** Historique paginé des duels — même préfixe pour l'invalidation. */
    games: (
      userId: string,
      params: Omit<ProfileGamesParams, "page" | "size">
    ) => ["profiles", "games", userId, params] as const,
    headToHead: (userId: string, against: string) =>
      ["profiles", "head-to-head", userId, against] as const,
    topics: (userId: string) => ["profiles", "topics", userId] as const,
    /** Activité journalière (série) sur une fenêtre. */
    activity: (userId: string, from: string, to: string) =>
      ["profiles", "activity", userId, from, to] as const,
    /** Collection de badges : tout le catalogue, paliers verrouillés compris. */
    badges: (userId: string) => ["profiles", "badges", userId] as const,
    /** Titres thématiques débloqués + clé du titre porté. */
    titles: (userId: string) => ["profiles", "titles", userId] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params: { unreadOnly: boolean; page: number; size: number }) =>
      ["notifications", "list", params] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
    preferences: () => ["notification-preferences"] as const,
  },
  questions: {
    reports: (questionId: string) =>
      ["questions", "reports", questionId] as const,
  },
  games: {
    active: () => ["games", "active"] as const,
    review: (gameId: string) => ["games", "review", gameId] as const,
    notifications: (gameId: string) =>
      ["games", "notifications", gameId] as const,
    result: (gameId: string) => ["games", "result", gameId] as const,
  },
  rooms: {
    mine: () => ["rooms", "mine"] as const,
  },
  challenges: {
    detail: (challengeId: string) =>
      ["challenges", "detail", challengeId] as const,
    mine: () => ["challenges", "mine"] as const,
  },
  presence: {
    detail: (userId: string) => ["presence", "detail", userId] as const,
  },
} as const
