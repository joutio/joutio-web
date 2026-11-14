import type { MeView, PeopleSort } from '@joutio/client-domain/api-types'
import type { BotDifficulty } from '@joutio/client-domain/game'
import { planLimits, problemLimit, quotaProblemOf } from '@joutio/client-domain/premium'
import { applyMatchmakingNotification, applyRoomNotification, emptyMatchmaking, emptyRoom, type MatchmakingNotification, type RoomNotification } from '@joutio/client-domain/rooms'
import { LightningIcon } from '@phosphor-icons/react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { useMe } from '@/features/me'
import { useT } from '@/lib/i18n'
import { optimisticUpdate } from '@/lib/optimistic-cache'
import { queryKeys } from '@/lib/query-keys'
import { readServerNow, subscribeStomp, useEventStream } from '@/lib/realtime'
import { showPremium } from '@/features/premium'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { PLAY_ENDPOINTS, playService } from '../lib/play-service'

/** Sujet passé d'écran en écran (`location.state`) : l'en-tête s'affiche sans attendre le serveur. */
export type PlayTopic = { topicId: string; name: string; category?: string | null }

/* ───────────── Difficulté du robot (mémoire locale à l'appareil, `lancer-partie.md` § 4) ───────────── */

const DIFFICULTY_KEY = 'joutio.botDifficulty'
const DIFFICULTIES: BotDifficulty[] = ['EASY', 'NORMAL', 'HARD']
const storedDifficulty = (): BotDifficulty => {
  try {
    const value = localStorage.getItem(DIFFICULTY_KEY)
    return value && DIFFICULTIES.includes(value as BotDifficulty) ? (value as BotDifficulty) : 'NORMAL'
  } catch {
    return 'NORMAL'
  }
}

export const useBotDifficulty = create<{ difficulty: BotDifficulty; set: (difficulty: BotDifficulty) => void }>((set) => ({
  difficulty: storedDifficulty(),
  set: (difficulty) => {
    set({ difficulty })
    try {
      localStorage.setItem(DIFFICULTY_KEY, difficulty)
    } catch {
      /* stockage indisponible : la difficulté vaut pour la session */
    }
  },
}))

/* ───────────── Préférence « entraînement si aucun adversaire » (profil, `matchmaking.md` § 5) ───────────── */

/** `true` par défaut, y compris tant que le BFF n'expose pas le champ. */
export function useAutoTrain() {
  const me = useMe()
  const client = useQueryClient()
  const t = useT()
  const mutation = useMutation({
    mutationFn: (next: boolean) => playService.setAutoTrain(me.data?.userId ?? '', next),
    onMutate: (next: boolean) => optimisticUpdate(client, [queryKeys.me], () => client.setQueryData<MeView>(queryKeys.me, (data) => (data ? { ...data, autoTrainOnTimeout: next } : data))),
    onError: (_error, _next, context) => {
      context?.rollback()
      toast.error(t('play.settingError'))
    },
  })
  return { enabled: me.data?.autoTrainOnTimeout ?? true, pending: mutation.isPending, set: (next: boolean) => mutation.mutate(next) }
}

/* ───────────── Lancements ───────────── */

/**
 * Limite atteinte (`defis.md` § 3) : `Dialog` Voir mes défis, Passer Premium (sans Premium), Fermer. La limite vient de
 * l'erreur, sinon de `MeView.limits`. Vrai si l'erreur était un quota de défis ou de salons.
 */
function useQuotaDialog() {
  const t = useT()
  const navigate = useNavigate()
  const me = useMe().data
  return (error: unknown) => {
    const problem = quotaProblemOf(error)
    if (problem !== 'challenges' && problem !== 'rooms') return false
    const rooms = problem === 'rooms'
    const limits = planLimits(me)
    const limit = problemLimit(error) ?? (rooms ? limits.openRooms : limits.pendingChallenges)
    showDialog({
      title: t(rooms ? 'play.roomQuotaTitle' : 'play.challengeQuotaTitle'),
      message: t(rooms ? 'play.roomQuotaText' : 'play.challengeQuotaText', { limit }),
      icon: LightningIcon,
      tone: 'accent',
      actions: [
        { label: t('play.seeChallenges'), variant: 'filled', tone: 'accent', onClick: () => void navigate(ROUTES.challenges) },
        ...(me?.premium ? [] : [{ label: t('play.goPremium'), variant: 'tinted' as const, tone: 'accent' as const, onClick: () => showPremium('quota') }]),
        { label: t('play.close'), variant: 'plain', tone: 'neutral' },
      ],
    })
    return true
  }
}

function useLaunchError() {
  const t = useT()
  return (title: Parameters<typeof t>[0], text: Parameters<typeof t>[0] = 'home.errorText') => toast.error(t(title), t(text))
}

/** Échec de création d'un salon bot : garde-fou anti-spam identique pour tous (P22), Premium n'y change rien. */
function useBotRoomError() {
  const fail = useLaunchError()
  return (error: unknown) =>
    fail(quotaProblemOf(error) === 'rooms' ? 'play.botQuotaError' : 'play.trainingError', quotaProblemOf(error) === 'rooms' ? 'play.botQuotaText' : undefined)
}

/** Entraînement contre le robot : la salle bot se prépare, puis le duel s'ouvre. */
export function useStartTraining() {
  const navigate = useNavigate()
  const onError = useBotRoomError()
  return useMutation({
    mutationFn: ({ topic, difficulty }: { topic: PlayTopic; difficulty: BotDifficulty }) => playService.createBotRoom(topic.topicId, difficulty),
    onSuccess: ({ id }, { topic }) => void navigate(ROUTES.room(id), { state: { topic } }),
    onError,
  })
}

/**
 * Salon bot créé sans navigation : l'appelant attend la réponse (commande traitée) et choisit l'écran suivant — fin de
 * l'onboarding, qui doit d'abord être enregistrée avant d'ouvrir le salon.
 */
export function useCreateBotRoom() {
  const onError = useBotRoomError()
  return useMutation({
    mutationFn: ({ topicId, difficulty }: { topicId: string; difficulty: BotDifficulty }) => playService.createBotRoom(topicId, difficulty),
    onError,
  })
}

/** « Défier le monde » : ticket d'appariement, puis l'écran de recherche. */
export function useStartMatchmaking() {
  const navigate = useNavigate()
  const fail = useLaunchError()
  return useMutation({
    mutationFn: (topic: PlayTopic) => playService.enqueue(topic.topicId),
    onSuccess: (ticket, topic) => void navigate(ROUTES.play(ticket.ticketId), { state: { topic } }),
    onError: () => fail('play.matchmakingError'),
  })
}

/** Salon privé à partager par lien. */
export function useCreatePrivateRoom() {
  const navigate = useNavigate()
  const fail = useLaunchError()
  const quota = useQuotaDialog()
  return useMutation({
    mutationFn: (topic: PlayTopic) => playService.createRoom(topic.topicId),
    onSuccess: ({ id }, topic) => void navigate(ROUTES.room(id), { state: { topic } }),
    onError: (error) => {
      if (!quota(error)) fail('play.roomError')
    },
  })
}

/** Défi nominatif : envoyé, l'invité l'accepte depuis ses Défis. */
export function useChallengePlayer() {
  const t = useT()
  const fail = useLaunchError()
  const quota = useQuotaDialog()
  return useMutation({
    mutationFn: ({ topic, opponent }: { topic: PlayTopic; opponent: { userId: string; pseudonym: string } }) => playService.challenge(topic.topicId, opponent.userId),
    onSuccess: (_result, { topic, opponent }) => toast.success(t('play.challengeSent'), `${opponent.pseudonym} · ${topic.name}`),
    onError: (error) => {
      if (!quota(error)) fail('play.challengeError')
    },
  })
}

/* ───────────── Contacts (Défier un joueur) ───────────── */

export function useContacts(direction: 'following' | 'followers', query: string, enabled: boolean, sort: PeopleSort = 'RECENT') {
  const userId = useMe().data?.userId ?? ''
  return useInfiniteQuery({
    queryKey: queryKeys.contacts.list(userId, direction, query, sort),
    queryFn: ({ pageParam }) => playService.contacts(userId, direction, query, sort, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
  })
}

/* ───────────── Temps réel ───────────── */

/** Salle : vue REST (sujet, adversaire) et état replié de ses notifications (REST à l'ouverture, puis STOMP). */
export function useRoom(roomId: string) {
  const view = useQuery({ queryKey: ['rooms', roomId], queryFn: () => playService.room(roomId), staleTime: Infinity, retry: 2, enabled: Boolean(roomId) })
  const stream = useEventStream<RoomNotification, ReturnType<typeof emptyRoom>>(
    roomId
      ? {
          destination: `/topic/rooms/${roomId}`,
          load: () => playService.roomNotifications(roomId),
          initial: () => emptyRoom(roomId),
          apply: applyRoomNotification,
          notFoundGraceMs: 5_000,
        }
      : null,
  )
  return { view, room: stream.state, status: stream.status }
}

/** Ticket d'appariement, replié de ses notifications. */
export function useTicket(ticketId: string) {
  return useEventStream<MatchmakingNotification, ReturnType<typeof emptyMatchmaking>>(
    ticketId
      ? {
          destination: `/topic/matchmaking/tickets/${ticketId}`,
          load: () => playService.ticketNotifications(ticketId),
          initial: () => emptyMatchmaking(ticketId),
          apply: applyMatchmakingNotification,
          notFoundGraceMs: 5_000,
        }
      : null,
  )
}

type PresenceProblem = { type?: string; title?: string; detail?: string }

/**
 * Présence dans le salon tant que l'écran est ouvert : l'app s'abonne au canal de présence et le serveur en
 * déduit l'entrée, la sortie (écran quitté) et la déconnexion (après une grâce). Rien n'est déclaré par l'app.
 * Un refus d'entrée arrive sur la file personnelle ; « Réessayer » se réabonne.
 */
export function useRoomPresence(roomId: string) {
  const [attempt, setAttempt] = useState(0)
  const [failure, setFailure] = useState<{ attempt: number; problem: PresenceProblem } | null>(null)
  useEffect(() => {
    const offErrors = subscribeStomp(PLAY_ENDPOINTS.roomPresenceErrors, (message) => {
      try {
        const body = JSON.parse(message.body) as { roomId?: string; problem?: PresenceProblem }
        if (body.roomId === roomId) setFailure({ attempt, problem: body.problem ?? {} })
      } catch {
        // Trame illisible : ignorée.
      }
    })
    const offPresence = subscribeStomp(PLAY_ENDPOINTS.roomPresence(roomId), () => undefined)
    return () => {
      offPresence()
      offErrors()
    }
  }, [roomId, attempt])
  const current = failure?.attempt === attempt ? failure.problem : null
  return { failed: current !== null, problem: current, retry: () => setAttempt((value) => value + 1) }
}

/** Recherche en cours tant que l'écran est ouvert : le quitter (ou perdre la connexion) l'annule côté serveur. */
export function useTicketPresence(ticketId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !ticketId) return
    return subscribeStomp(PLAY_ENDPOINTS.ticketPresence(ticketId), () => undefined)
  }, [ticketId, enabled])
}

/** Relance de l'adversaire absent, avec la cadence affichée tout de suite. */
export function useWizzRoom(roomId: string) {
  const t = useT()
  const [sentAt, setSentAt] = useState<number | null>(null)
  const mutation = useMutation({
    mutationFn: () => playService.wizzRoom(roomId),
    onMutate: () => {
      const previous = sentAt
      setSentAt(readServerNow())
      return { previous }
    },
    onError: (_error, _variables, context) => {
      setSentAt(context?.previous ?? null)
      toast.error(t('play.wizzError'))
    },
  })
  return { ...mutation, sentAt }
}

/** Fermeture du salon par l'initiateur. */
export function useCloseRoom() {
  const t = useT()
  return useMutation({
    mutationFn: (roomId: string) => playService.cancelRoom(roomId),
    onError: () => toast.error(t('play.closeError'), t('home.errorText')),
  })
}

/** Profil d'un joueur (second joueur d'un salon partagé, que la vue REST de la salle ne connaît pas). */
export function usePlayerProfile(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['profiles', userId, 'profile'],
    queryFn: () => playService.profile(userId),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
  })
}
