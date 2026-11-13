import type { MeView, TopicOverviewView } from '@joutio/client-domain/api-types'
import { applyGameNotification, emptyGame } from '@joutio/client-domain/game'
import { activityDate, streakDayUnlocked } from '@joutio/client-domain/profile'
import { profileService } from '@/features/profile'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameService } from '@/features/duel'
import type { PlayTopic } from '@/features/play'
import { useT } from '@/lib/i18n'
import { queryKeys } from '@/lib/query-keys'
import { readServerNow, usePersonalNotifications } from '@/lib/realtime'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { resultService } from '../lib/result-service'

/**
 * Bilan autoritaire d'un duel terminé. La récompense est calculée après la fin : on relit tant qu'elle manque (aucun
 * canal STOMP ne la porte), puis plus jamais. Une partie consultée depuis l'historique n'attend rien.
 */
export function useGameResult(gameId: string, waitForReward: boolean) {
  const client = useQueryClient()
  const applied = useRef<string | null>(null)
  const result = useQuery({
    queryKey: ['games', gameId, 'result'],
    queryFn: () => gameService.result(gameId),
    enabled: Boolean(gameId),
    retry: 3,
    refetchInterval: (query) => (waitForReward && query.state.data && query.state.data.reward === null && !query.state.data.botGame ? 1_500 : false),
  })
  useEffect(() => {
    const data = result.data
    if (!waitForReward || !data || (!data.botGame && !data.reward) || applied.current === gameId) return
    applied.current = gameId
    client.setQueryData<MeView>(queryKeys.me, (me) => (me ? { ...me, progression: data.progression } : me))
    client.setQueryData<TopicOverviewView>(queryKeys.topic.overview(data.topic.topicId), (view) =>
      view?.myProgress
        ? {
            ...view,
            myProgress: {
              ...view.myProgress,
              xp: data.topicMastery.xp,
              tierProgressPercent: data.topicMastery.tierProgressPercent,
              tierRemainingXp: data.topicMastery.tierRemainingXp,
            },
          }
        : view,
    )
    // Une partie terminée est un résultat calculé par le serveur, pas une mutation du joueur : les vues qu'elle touche
    // se relisent (règle des mutations : l'invalidation reste permise pour les données calculées par le serveur).
    const userId = client.getQueryData<MeView>(queryKeys.me)?.userId
    if (userId) void client.invalidateQueries({ queryKey: ['profiles', userId] })
    void client.invalidateQueries({ queryKey: queryKeys.topic.all(data.topic.topicId) })
    void client.invalidateQueries({ queryKey: queryKeys.home })
  }, [client, gameId, result.data, waitForReward])
  return result
}

/** Partie terminée, repliée depuis l'historique REST (aucun STOMP : plus rien ne bouge). */
export function useGameHistory(gameId: string) {
  return useQuery({
    queryKey: ['games', gameId, 'notifications'],
    queryFn: () => gameService.notifications(gameId),
    enabled: Boolean(gameId),
    staleTime: Infinity,
    select: (envelopes) =>
      [...envelopes].sort((left, right) => left.sequenceNumber - right.sequenceNumber).reduce((state, envelope) => applyGameNotification(state, envelope.payload), emptyGame(gameId)),
  })
}

/** Secondes avant une échéance serveur. */
function useSecondsUntil(at: number | null) {
  const [now, setNow] = useState(readServerNow)
  useEffect(() => {
    if (at === null) return
    const timer = window.setInterval(() => setNow(readServerNow()), 250)
    return () => window.clearInterval(timer)
  }, [at])
  return at === null ? 0 : Math.max(0, Math.ceil((at - now) / 1000))
}

export type RematchState = 'idle' | 'pending' | 'refused'

/** Fenêtre de réponse d'une revanche (le défi expire vite côté serveur). */
const REMATCH_WINDOW_MS = 10_000

/**
 * Proposer une revanche (repris de `joutio-mobile`, `use-rematch.ts`) : défi nominatif avec la partie d'origine, puis la
 * réponse arrive par le flux personnel — `ROOM_ACCEPTED` ouvre le salon, `CHALLENGE_DECLINED` l'annonce. Aucun GET de
 * confirmation ; sans réponse à l'échéance, le bouton revient.
 */
export function useSendRematch({ userId, opponentId, topic, gameId }: { userId?: string; opponentId: string | null; topic: PlayTopic; gameId: string }) {
  const t = useT()
  const navigate = useNavigate()
  const [state, setState] = useState<RematchState>('idle')
  const [sending, setSending] = useState(false)
  const [challenge, setChallenge] = useState<{ id: string; deadline: number } | null>(null)
  const seconds = useSecondsUntil(challenge?.deadline ?? null)
  const settled = useRef(false)

  usePersonalNotifications(state === 'pending' ? userId : undefined, (notification) => {
    if (settled.current) return
    if (notification.type === 'ROOM_ACCEPTED' && notification.actorId === opponentId && notification.topicId === topic.topicId && notification.sourceId) {
      settled.current = true
      void navigate(ROUTES.room(notification.sourceId), { replace: true, state: { topic } })
    }
    if (notification.type === 'CHALLENGE_DECLINED' && challenge && notification.sourceId === challenge.id) {
      settled.current = true
      setState('refused')
      setChallenge(null)
      toast.error(t('result.rematchDeclined'))
    }
  })

  useEffect(() => {
    if (state !== 'pending' || !challenge || seconds > 0 || settled.current) return
    settled.current = true
    // Fin de la fenêtre : l'état revient au repos.
    setState('idle')
    setChallenge(null)
    toast.error(t('result.rematchNoAnswer'), t('result.rematchNoAnswerText'))
  }, [state, challenge, seconds, t])

  const send = async () => {
    if (state !== 'idle' || !opponentId || !topic.topicId) return
    settled.current = false
    setState('pending')
    setSending(true)
    try {
      const { id } = await resultService.rematch(topic.topicId, opponentId, gameId)
      if (!settled.current) setChallenge({ id, deadline: readServerNow() + REMATCH_WINDOW_MS })
    } catch {
      setState('idle')
      toast.error(t('result.rematchError'), t('home.errorText'))
    } finally {
      setSending(false)
    }
  }

  return { state, seconds, sending, send }
}

/**
 * Nouveau jour de série ouvert par cette partie (2026-11-13, `resultat.md` § 1) : l'activité est relue **une fois** pour
 * la partie (jamais le cache du profil, qui peut dater d'avant le duel), puis la règle partagée tranche. Jamais pour un
 * entraînement contre le bot, qui ne compte pas dans la série.
 */
export function useStreakUnlock(gameId: string, userId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['games', gameId, 'streak-unlock'],
    queryFn: async () => streakDayUnlocked(await profileService.activity(userId ?? ''), activityDate(readServerNow())),
    enabled: enabled && Boolean(userId),
    staleTime: Infinity,
    retry: 1,
  })
}
