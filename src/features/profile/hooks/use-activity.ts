import { useQuery } from '@tanstack/react-query'
import { useMe } from '@/features/me'
import { queryKeys } from '@/lib/query-keys'
import { profileService } from '../lib/profile-service'

/** Activité du joueur courant : série en jours (`currentStreak`). */
export function useMyActivity() {
  const userId = useMe().data?.userId
  return useQuery({
    enabled: Boolean(userId),
    queryKey: queryKeys.profiles.activity(userId ?? ''),
    queryFn: () => profileService.activity(userId!),
    staleTime: 60_000,
  })
}
