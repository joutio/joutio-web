import { useTitles, useWearTitle as useWearCommand } from '@joutio/client/profile'
import { useFollowTopic as useFollowCommand } from '@joutio/client/topics'
import { useT } from '@/lib/i18n'
import { selectUserId, useSessionStore } from '@/lib/session'
import { toast } from '@/shared/toast'

/** Mes titres, pour savoir lequel est porté. */
export function useMyTitles() {
  return useTitles(useSessionStore(selectUserId) ?? undefined)
}

/** Suivre (`mutate(true)`) ou ne plus suivre un sujet : optimiste dans `@joutio/client`, un refus s'annonce en toast. */
export function useFollowTopic(topicId: string) {
  const t = useT()
  const command = useFollowCommand(topicId)
  return {
    isPending: command.isPending,
    mutate: (follow: boolean) => command.mutate(follow, { onError: () => toast.error(t(follow ? 'topic.followError' : 'topic.unfollowError'), t('home.errorText')) }),
  }
}

/** Porter un titre (`topicId:TIER`) ou enlever le titre porté (`null`) : optimiste dans `@joutio/client`, refus en toast. */
export function useWearTitle() {
  const t = useT()
  const command = useWearCommand(useSessionStore(selectUserId) ?? '')
  return {
    isPending: command.isPending,
    mutate: (titleKey: string | null) => command.mutate(titleKey, { onError: () => toast.error(t(titleKey === null ? 'topic.removeTitleError' : 'topic.wearTitleError')) }),
  }
}
