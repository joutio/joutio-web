import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Page } from "@/shared/types/api"
import type {
  TopicCard,
  TopicCategory,
  TopicFacets,
  TopicFacetsParams,
  TopicLeaderboard,
  TopicLeaderboardParams,
  TopicListParams,
  TopicOverview,
} from "../domain/topic"

const MAX_PAGE_SIZE = 100

/** Catalogue, facettes, fiche agrégée, suivi et classement d'un sujet. */
export const topicsService = {
  list: (params: TopicListParams = {}): Promise<Page<TopicCard>> =>
    api.get<Page<TopicCard>>(ENDPOINTS.topics.list, {
      params: {
        q: params.q?.trim() || undefined,
        category: params.category,
        followed: params.followed ? true : undefined,
        mine: params.mine ? true : undefined,
        sort: params.sort,
        page: params.page ?? 0,
        size: Math.min(params.size ?? 24, MAX_PAGE_SIZE),
      },
    }),

  facets: (params: TopicFacetsParams = {}): Promise<TopicFacets> =>
    api.get<TopicFacets>(ENDPOINTS.topics.facets, {
      params: {
        q: params.q?.trim() || undefined,
        followed: params.followed ? true : undefined,
      },
    }),

  categories: (): Promise<TopicCategory[]> =>
    api.get<TopicCategory[]>(ENDPOINTS.topics.categories),

  overview: (topicId: string): Promise<TopicOverview> =>
    api.get<TopicOverview>(ENDPOINTS.topics.overview(topicId)),

  follow: (topicId: string): Promise<void> =>
    api.put<void>(ENDPOINTS.topics.follow(topicId)),

  unfollow: (topicId: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.topics.follow(topicId)),

  leaderboard: (
    topicId: string,
    params: TopicLeaderboardParams = {}
  ): Promise<TopicLeaderboard> =>
    api.get<TopicLeaderboard>(ENDPOINTS.topics.leaderboard(topicId), {
      params: {
        period: params.period ?? "ALL_TIME",
        scope: params.scope ?? "WORLD",
        month: params.month,
        page: params.page ?? 0,
        size: Math.min(params.size ?? 50, MAX_PAGE_SIZE),
      },
    }),
}
