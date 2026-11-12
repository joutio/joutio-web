import type { MeView, PlayerProfileView } from '@joutio/client-domain/api-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/features/me'
import { useT } from '@/lib/i18n'
import { optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { toast } from '@/shared/toast'
import { playerService } from '../lib/player-service'

/** Fiche publique d'un joueur. */
export function usePlayerProfile(userId: string) {
  return useQuery({ queryKey: queryKeys.profiles.profile(userId), queryFn: () => playerService.profile(userId), enabled: Boolean(userId), staleTime: 30_000 })
}

/** Mon bilan contre ce joueur. */
export function useHeadToHead(against: string) {
  const userId = useMe().data?.userId ?? ''
  return useQuery({
    queryKey: queryKeys.profiles.headToHead(userId, against),
    queryFn: () => playerService.headToHead(userId, against),
    enabled: Boolean(userId && against),
    staleTime: 60_000,
  })
}

/** Suivre / ne plus suivre un joueur, **optimiste** : fiche et compteurs changent tout de suite, restaurés si refus. */
export function useFollowPlayer(userId: string) {
  const client = useQueryClient()
  const t = useT()
  const key = queryKeys.profiles.profile(userId)
  return useMutation({
    mutationFn: (follow: boolean) => playerService.follow(userId, follow),
    onMutate: (follow: boolean) =>
      optimisticUpdate(client, [key, queryKeys.me], () => {
        const previous = client.getQueryData<PlayerProfileView>(key)
        const delta = previous?.following === follow ? 0 : follow ? 1 : -1
        client.setQueryData<PlayerProfileView>(key, (profile) =>
          profile ? { ...profile, following: follow, followersCount: Math.max(0, profile.followersCount + delta) } : profile,
        )
        client.setQueryData<MeView>(queryKeys.me, (me) => (me ? { ...me, followingCount: Math.max(0, me.followingCount + delta) } : me))
      }),
    onError: (_error, follow, context) => {
      context?.rollback()
      toast.error(t(follow ? 'player.followError' : 'player.unfollowError'), t('home.errorText'))
    },
    // Les listes Social (abonnements, abonnés) se relisent : leur contenu et leurs totaux changent.
    onSettled: () => void client.invalidateQueries({ queryKey: queryKeys.contacts.all }),
  })
}
