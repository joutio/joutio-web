import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Page } from "@/shared/types/api"
import type { GameHistoryItem, HeadToHead } from "../domain/history"
import type {
  Language,
  PeopleDirection,
  PeopleParams,
  PlayerCard,
  PlayerProfile,
  ProfileActivity,
  ProfileGamesParams,
  TopicStat,
} from "../domain/profile"
import type { Presence } from "../domain/presence"

const MAX_PAGE_SIZE = 100

function peoplePath(userId: string, direction: PeopleDirection): string {
  return direction === "following"
    ? ENDPOINTS.profiles.following(userId)
    : ENDPOINTS.profiles.followers(userId)
}

/** Fiche joueur, listes de personnes, historique, suivi, activité et présence. */
export const profilesService = {
  profile: (userId: string): Promise<PlayerProfile> =>
    api.get<PlayerProfile>(ENDPOINTS.profiles.detail(userId)),

  updatePseudonym: (userId: string, pseudonym: string): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.pseudonym(userId), { pseudonym }),

  updateBio: (userId: string, bio: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.bio(userId), { bio }),

  updateCountry: (userId: string, country: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.country(userId), { country }),

  updateAvatarOptions: (
    userId: string,
    avatarOptions: string | null
  ): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.avatarOptions(userId), { avatarOptions }),

  updateBanner: (userId: string, bannerUrl: string | null): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.banner(userId), { bannerUrl }),

  updateLanguage: (userId: string, language: Language): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.language(userId), { language }),

  people: (
    userId: string,
    direction: PeopleDirection,
    params: PeopleParams = {}
  ): Promise<Page<PlayerCard>> =>
    api.get<Page<PlayerCard>>(peoplePath(userId, direction), {
      params: {
        q: params.q?.trim() || undefined,
        sort: params.sort ?? "RECENT",
        page: params.page ?? 0,
        size: Math.min(params.size ?? 20, MAX_PAGE_SIZE),
      },
    }),

  follow: (userId: string): Promise<void> =>
    api.put<void>(ENDPOINTS.profiles.follow(userId)),

  unfollow: (userId: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.profiles.follow(userId)),

  games: (
    userId: string,
    params: ProfileGamesParams = {}
  ): Promise<Page<GameHistoryItem>> =>
    api.get<Page<GameHistoryItem>>(ENDPOINTS.profiles.games(userId), {
      params: {
        topicId: params.topicId,
        opponentId: params.opponentId,
        opponentType: params.opponentType,
        outcome:
          params.outcome && params.outcome !== "ALL"
            ? params.outcome
            : undefined,
        sort: params.sort,
        page: params.page ?? 0,
        size: Math.min(params.size ?? 20, MAX_PAGE_SIZE),
      },
    }),

  headToHead: (userId: string, against: string): Promise<HeadToHead> =>
    api.get<HeadToHead>(ENDPOINTS.profiles.headToHead(userId), {
      params: { against },
    }),

  topicStats: (userId: string): Promise<TopicStat[]> =>
    api.get<TopicStat[]>(ENDPOINTS.profiles.topics(userId)),

  activity: (
    userId: string,
    from?: string,
    to?: string
  ): Promise<ProfileActivity> =>
    api.get<ProfileActivity>(ENDPOINTS.profiles.activity(userId), {
      params: { from, to },
    }),

  presence: (userId: string): Promise<Presence> =>
    api.get<Presence>(ENDPOINTS.presence.detail(userId)),
}
