import { useQuery } from '@tanstack/react-query'
import { useMe } from '@/features/me'
import { activityQuery, badgesQuery, playedTopicsQuery, queryKeys, rewardsQuery } from '@joutio/client/query'
import { profileService } from '../lib/profile-service'
import { api } from '@/lib/api'

const useUserId = () => useMe().data?.userId ?? ''

/** Série et jours joués sur 365 jours. */
export function useMyActivity() {
  const userId = useUserId()
  return useQuery({ enabled: Boolean(userId), ...activityQuery(api, userId), staleTime: 60_000 })
}

/** Collection de badges, par famille. */
export function useMyBadges() {
  const userId = useUserId()
  return useQuery({ enabled: Boolean(userId), ...badgesQuery(api, userId), staleTime: 60_000 })
}

/** Sujets joués : parties et XP par sujet (donut, Sujets joués). */
export function useMyTopics() {
  const userId = useUserId()
  return useQuery({ enabled: Boolean(userId), ...playedTopicsQuery(api, userId), staleTime: 60_000 })
}

/** Récompenses (styles d'avatar) : Micah dans la page Série. */
export function useMyRewards() {
  return useQuery({ ...rewardsQuery(api), staleTime: 60_000 })
}

/** Les 10 dernières parties, tous sujets confondus. */
export function useMyRecentGames() {
  const userId = useUserId()
  return useQuery({ enabled: Boolean(userId), queryKey: queryKeys.profiles.recentGames(userId), queryFn: () => profileService.recentGames(userId), staleTime: 60_000 })
}
