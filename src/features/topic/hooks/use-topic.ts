import type { HomeView, MeView, TitlesView, TopicCardView, TopicOverviewView } from '@joutio/client-domain/api-types'
import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useMe } from '@/features/me'
import type { TopicPage } from '@/features/topics'
import { useT } from '@/lib/i18n'
import { optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/shared/toast'
import { topicService } from '../lib/topic-service'

/** En-tête, chiffres et progression du sujet. */
export function useTopicOverview(topicId: string) {
  return useQuery({ queryKey: queryKeys.topic.overview(topicId), queryFn: () => topicService.overview(topicId), enabled: Boolean(topicId), staleTime: 30_000 })
}

/** Top 10 depuis toujours et ma ligne. */
export function useTopicLeaderboard(topicId: string) {
  return useQuery({ queryKey: queryKeys.topic.leaderboard(topicId), queryFn: () => topicService.leaderboard(topicId), enabled: Boolean(topicId), staleTime: 60_000 })
}

/** Mes 10 dernières parties du sujet. */
export function useTopicGames(topicId: string) {
  const userId = useMe().data?.userId
  return useQuery({
    queryKey: queryKeys.topic.games(topicId, userId ?? ''),
    queryFn: () => topicService.games(userId!, topicId),
    enabled: Boolean(userId && topicId),
    staleTime: 60_000,
  })
}

/** Mes titres, pour savoir lequel est porté. */
export function useMyTitles() {
  const userId = useMe().data?.userId
  return useQuery({ queryKey: queryKeys.profiles.titles(userId ?? ''), queryFn: () => topicService.titles(userId!), enabled: Boolean(userId), staleTime: 60_000 })
}

/**
 * Suivre / ne plus suivre, **optimiste** (règle des mutations de `joutio-mobile` § Mutations) : fiche, catalogue et
 * rails de l'Accueil changent tout de suite, restaurés seulement si le BFF refuse ; aucune relecture après succès.
 */
export function useFollowTopic(topicId: string) {
  const client = useQueryClient()
  const t = useT()
  const key = queryKeys.topic.overview(topicId)
  return useMutation({
    mutationFn: (follow: boolean) => topicService.follow(topicId, follow),
    onMutate: (follow: boolean) =>
      optimisticUpdate(client, [key, ['topics', 'list'], queryKeys.home], () => {
        const previous = client.getQueryData<TopicOverviewView>(key)
        const flip = (topic: TopicCardView) =>
          topic.topicId === topicId
            ? { ...topic, followed: follow, followersCount: Math.max(0, topic.followersCount + (topic.followed === follow ? 0 : follow ? 1 : -1)) }
            : topic
        if (previous) client.setQueryData<TopicOverviewView>(key, { ...previous, topic: flip(previous.topic) })
        for (const [listKey, data] of client.getQueriesData<InfiniteData<TopicPage>>({ queryKey: ['topics', 'list'] })) {
          if (!data) continue
          const filters = listKey[2] as { followed?: boolean; hideFollowed?: boolean }
          client.setQueryData(listKey, {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              topics: page.topics.map(flip).filter((topic) => !((filters.followed && !topic.followed) || (filters.hideFollowed && topic.followed))),
            })),
          })
        }
        const card = previous?.topic
        client.setQueryData<HomeView>(queryKeys.home, (data) =>
          data
            ? {
                ...data,
                followedTopics: follow
                  ? data.followedTopics.some((topic) => topic.topicId === topicId)
                    ? data.followedTopics.map(flip)
                    : card
                      ? [...data.followedTopics, flip(card)]
                      : data.followedTopics
                  : data.followedTopics.filter((topic) => topic.topicId !== topicId),
                trendingTopics: data.trendingTopics.map(flip),
                newTopics: data.newTopics.map(flip),
                recommendedTopics: data.recommendedTopics.map(flip),
              }
            : data,
        )
      }),
    onError: (_error, follow, context) => {
      context?.rollback()
      toast.error(t(follow ? 'topic.followError' : 'topic.unfollowError'), t('home.errorText'))
    },
  })
}

/** Porter un titre du sujet, ou enlever le titre porté : optimiste, restauré en cas de refus. */
export function useWearTitle() {
  const client = useQueryClient()
  const t = useT()
  const userId = useMe().data?.userId ?? ''
  const key = queryKeys.profiles.titles(userId)
  return useMutation({
    mutationFn: (titleKey: string | null) => topicService.wearTitle(userId, titleKey),
    onMutate: (titleKey: string | null) =>
      optimisticUpdate(client, [key, queryKeys.me], () => {
        client.setQueryData<TitlesView>(key, (titles) => (titles ? { ...titles, equippedKey: titleKey } : titles))
        client.setQueryData<MeView>(queryKeys.me, (me) => (me ? { ...me, equippedTitle: titleKey } : me))
      }),
    onError: (_error, titleKey, context) => {
      context?.rollback()
      toast.error(t(titleKey === null ? 'topic.removeTitleError' : 'topic.wearTitleError'))
    },
  })
}
