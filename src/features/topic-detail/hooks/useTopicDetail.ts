import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import type { InfiniteData } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { topicsService } from "@/features/topics"
import type { Page } from "@/shared/types/api"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import type {
  TopicCard,
  TopicLeaderboardParams,
  TopicOverview,
} from "@/features/topics/domain/topic"
import type { Home } from "@/features/home/domain/home"

/** Vue mutable (suivi, compteur d'abonnés) : `staleTime` court + focus, cf. `optimistic-reconcile`. */
const OVERVIEW_STALE_MS = 30 * 1000
const LEADERBOARD_STALE_MS = 5 * 60 * 1000
/** Pagination serveur du classement : pages chargées au défilement (scroll infini). */
const LEADERBOARD_PAGE_SIZE = 20

/** Fiche agrégée d'un sujet : carte (suivi inclus), rang réel et progression du joueur. */
export function useTopicOverview(topicId: string) {
  return useQuery({
    queryKey: queryKeys.topics.overview(topicId),
    queryFn: () => topicsService.overview(topicId),
    enabled: !!topicId,
    staleTime: OVERVIEW_STALE_MS,
    refetchOnWindowFocus: true,
  })
}

/**
 * Classement d'un sujet en **scroll infini** (20 entrées par page, pagination serveur) + rang du
 * joueur courant dans la même portée. Les filtres (période/portée/mois) changent la clé de
 * requête : un filtre repart de la première page.
 */
export function useTopicLeaderboard(
  topicId: string,
  params: Omit<TopicLeaderboardParams, "page" | "size">
) {
  return useInfiniteQuery({
    queryKey: queryKeys.topics.leaderboard(topicId, params),
    queryFn: ({ pageParam }) =>
      topicsService.leaderboard(topicId, {
        ...params,
        page: pageParam,
        size: LEADERBOARD_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.entries.last ? undefined : lastPage.entries.page + 1,
    enabled: !!topicId,
    staleTime: LEADERBOARD_STALE_MS,
    placeholderData: keepPreviousData,
  })
}

/**
 * Suivi/ne plus suivre un sujet, **optimiste** : la vue propriétaire (`topics.overview`), les
 * listes de sujets et l'accueil sont simulés au clic (`onMutate`), restaurés en erreur
 * (`onError`), puis **réconciliés jusqu'à convergence** (`onSettled`) : on relit la vue tant que
 * `followed` n'a pas basculé, sans écraser le patch avec une projection en retard.
 */
export function useToggleTopicFollow(topicId: string) {
  const queryClient = useQueryClient()
  const overviewKey = queryKeys.topics.overview(topicId)

  function patchOverview(next: boolean) {
    queryClient.setQueryData<TopicOverview>(overviewKey, (previous) =>
      previous
        ? {
            ...previous,
            topic: {
              ...previous.topic,
              followed: next,
              followersCount: Math.max(
                0,
                previous.topic.followersCount + (next ? 1 : -1)
              ),
            },
          }
        : previous
    )
  }

  function patchLists(next: boolean, card: TopicCard | undefined) {
    queryClient.setQueriesData<InfiniteData<Page<TopicCard>>>(
      { queryKey: ["topics", "list"] },
      (previous) =>
        previous
          ? {
              ...previous,
              pages: previous.pages.map((page) => ({
                ...page,
                content: page.content.map((topic) =>
                  topic.topicId === topicId
                    ? {
                        ...topic,
                        followed: next,
                        followersCount: Math.max(
                          0,
                          topic.followersCount + (next ? 1 : -1)
                        ),
                      }
                    : topic
                ),
              })),
            }
          : previous
    )

    queryClient.setQueryData<Home>(queryKeys.home(), (previous) => {
      if (!previous) return previous
      if (!next) {
        return {
          ...previous,
          followedTopics: previous.followedTopics.filter(
            (topic) => topic.topicId !== topicId
          ),
        }
      }
      if (
        !card ||
        previous.followedTopics.some((topic) => topic.topicId === topicId)
      ) {
        return previous
      }
      return { ...previous, followedTopics: [card, ...previous.followedTopics] }
    })
  }

  function invalidateTopicViews() {
    void queryClient.invalidateQueries({ queryKey: queryKeys.topics.all })
    void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
  }

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? topicsService.follow(topicId) : topicsService.unfollow(topicId),
    onMutate: async (next: boolean) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.topics.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.home() })
      const previousOverview =
        queryClient.getQueryData<TopicOverview>(overviewKey)
      const previousLists = queryClient.getQueriesData<
        InfiniteData<Page<TopicCard>>
      >({
        queryKey: ["topics", "list"],
      })
      const previousHome = queryClient.getQueryData<Home>(queryKeys.home())

      patchOverview(next)
      const card = queryClient.getQueryData<TopicOverview>(overviewKey)?.topic
      patchLists(next, card)

      return { previousOverview, previousLists, previousHome }
    },
    onError: (_error, _next, context) => {
      if (!context) return
      queryClient.setQueryData(overviewKey, context.previousOverview)
      context.previousLists.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      )
      queryClient.setQueryData(queryKeys.home(), context.previousHome)
    },
    onSettled: (_data, error, next) => {
      if (error) return
      void reconcileUntil<TopicOverview>({
        read: () => topicsService.overview(topicId),
        matches: (view) => view.topic.followed === next,
        onConverged: (view) => {
          queryClient.setQueryData(overviewKey, view)
          invalidateTopicViews()
        },
        onTimeout: invalidateTopicViews,
      })
    },
  })

  function toggle() {
    if (mutation.isPending) return
    const current =
      queryClient.getQueryData<TopicOverview>(overviewKey)?.topic.followed ??
      false
    mutation.mutate(!current)
  }

  return { toggle, isPending: mutation.isPending }
}
