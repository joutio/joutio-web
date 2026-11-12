import type { ChallengeView } from '@joutio/client-domain/api-types'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useTabBadges } from '@/features/shell'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { usePersonalNotifications } from '@/lib/realtime'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { topicName } from '@/shared/topics'
import { challengesService, splitChallenges } from '../lib/challenges-service'

/** Défis du joueur (reçus et envoyés). */
export function useMyChallenges(enabled = true) {
  return useQuery({ queryKey: queryKeys.challenges, queryFn: challengesService.mine, enabled, staleTime: 15_000 })
}

/** Salons du joueur. */
export function useMyRooms(enabled = true) {
  return useQuery({ queryKey: queryKeys.myRooms, queryFn: challengesService.rooms, enabled, staleTime: 15_000 })
}

/** Relit défis et salons : événements d'un autre joueur, jamais la confirmation d'une commande locale. */
export function refreshChallenges(client: QueryClient) {
  void client.invalidateQueries({ queryKey: queryKeys.challenges })
  void client.invalidateQueries({ queryKey: queryKeys.myRooms })
}

const CHALLENGE_EVENTS = new Set(['CHALLENGE_RECEIVED', 'CHALLENGE_DECLINED', 'ROOM_ACCEPTED'])

/**
 * Flux personnel STOMP : un défi reçu, refusé ou accepté relit défis et salons (aucun polling). Pose aussi la pastille
 * de l'onglet Défis (reçus en attente). Monté une fois pour toute l'app connectée.
 */
export function useChallengesRuntime() {
  const client = useQueryClient()
  const userId = useMe().data?.userId
  const challenges = useMyChallenges(Boolean(userId))
  const setBadge = useTabBadges((state) => state.set)
  const received = splitChallenges(challenges.data, userId ?? '').received.length
  useEffect(() => setBadge('challenges', received), [received, setBadge])
  usePersonalNotifications(userId, (notification) => {
    if (CHALLENGE_EVENTS.has(notification.type)) refreshChallenges(client)
  })
}

/** Change le statut des défis en cache (refus, annulation, acceptation). */
function settle(client: QueryClient, ids: readonly string[], status: ChallengeView['status']) {
  client.setQueryData<ChallengeView[]>(queryKeys.challenges, (items) => items?.map((item) => (ids.includes(item.challengeId) ? { ...item, status } : item)))
}

/**
 * Refus ou annulation, **optimiste** et par lot (Tout refuser : un `/decline` par défi, en parallèle). Un échec
 * partiel ne restaure que les défis refusés par le serveur.
 */
function useSettleChallenges(run: (id: string) => Promise<unknown>, status: 'DECLINED' | 'CANCELLED', error: MessageKey) {
  const client = useQueryClient()
  const t = useT()
  return useMutation({
    onMutate: async (ids: readonly string[]) => {
      const previous = client.getQueryData<ChallengeView[]>(queryKeys.challenges)
      await optimisticUpdate(client, [queryKeys.challenges], () => settle(client, ids, status))
      return { previous }
    },
    mutationFn: async (ids: readonly string[]) => {
      const results = await Promise.allSettled(ids.map(run))
      const failed = ids.filter((_id, index) => results[index]?.status === 'rejected')
      if (failed.length) throw Object.assign(new Error('partial failure'), { failed })
    },
    onError: (cause, ids, context) => {
      const failed = 'failed' in cause && Array.isArray(cause.failed) ? (cause.failed as string[]) : [...ids]
      client.setQueryData<ChallengeView[]>(queryKeys.challenges, (items) =>
        items?.map((item) =>
          failed.includes(item.challengeId) ? { ...item, status: context?.previous?.find((before) => before.challengeId === item.challengeId)?.status ?? 'PENDING' } : item,
        ),
      )
      toast.error(t(error), t('challenges.retryText'))
    },
  })
}

export const useDeclineChallenges = () => useSettleChallenges(challengesService.decline, 'DECLINED', 'challenges.declineError')
export const useCancelChallenges = () => useSettleChallenges(challengesService.cancel, 'CANCELLED', 'challenges.cancelError')

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Salle d'un défi accepté : la saga la crée et la vue du défi porte alors son `roomId`. Relue quelques fois, sans
 * recalculer côté client l'identifiant que dérive le serveur.
 */
async function roomOfAccepted(challengeId: string): Promise<string | null> {
  for (const delay of [0, 300, 500, 800, 1200, 1500]) {
    await wait(delay)
    try {
      const view = await challengesService.get(challengeId)
      if (view.roomId) return view.roomId
    } catch {
      // Relecture suivante.
    }
  }
  return null
}

/** Accepter : le défi est accepté, puis sa salle s'ouvre. */
export function useAcceptChallenge() {
  const client = useQueryClient()
  const navigate = useNavigate()
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  return useMutation({
    onMutate: (challenge: ChallengeView) => optimisticUpdate(client, [queryKeys.challenges], () => settle(client, [challenge.challengeId], 'ACCEPTED')),
    mutationFn: async (challenge: ChallengeView) => {
      await challengesService.accept(challenge.challengeId)
      return challenge.roomId ?? (await roomOfAccepted(challenge.challengeId))
    },
    onSuccess: (roomId, challenge) => {
      void client.invalidateQueries({ queryKey: queryKeys.myRooms })
      if (!roomId) {
        toast.error(t('challenges.roomPending'), t('challenges.roomPendingText'))
        return
      }
      const topic = { topicId: challenge.topic.topicId, name: topicName(challenge.topic.names, language), category: challenge.topic.category }
      void navigate(ROUTES.room(roomId), { state: { topic } })
    },
    onError: (_error, _challenge, context) => {
      context?.rollback()
      toast.error(t('challenges.acceptError'))
    },
  })
}
