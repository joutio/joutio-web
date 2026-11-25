import { useMe, useSetAutoTrain } from '@joutio/client/me'
import type { BotDifficulty } from '@joutio/client/game'
import { planLimits, problemLimit, quotaProblemOf } from '@joutio/client/premium'
import { useCreateBotRoom, useCreateChallenge, useCreateRoom, useEnqueueMatchmaking, useJoinRefusal, type JoinRefusal } from '@joutio/client/rooms'
import { LightningIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { useT } from '@/lib/i18n'
import { subscribeStomp } from '@/lib/realtime'
import { showPremium } from '@/features/premium'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'

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

/** `MeView.autoTrainOnTimeout` (`true` par défaut), changé tout de suite par `useSetAutoTrain` ; un refus en toast. */
export function useAutoTrain() {
  const me = useMe().data
  const t = useT()
  const mutation = useSetAutoTrain(me?.userId ?? '')
  return {
    enabled: me?.autoTrainOnTimeout ?? true,
    pending: mutation.isPending,
    set: (next: boolean) => mutation.mutate(next, { onError: () => toast.error(t('play.settingError')) }),
  }
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
        { label: t('play.seeChallenges'), variant: 'filled', tone: 'accent', onClick: () => void navigate(ROUTES.challengesTab('sent')) },
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
export function useBotRoomError() {
  const fail = useLaunchError()
  return (error: unknown) =>
    fail(quotaProblemOf(error) === 'rooms' ? 'play.botQuotaError' : 'play.trainingError', quotaProblemOf(error) === 'rooms' ? 'play.botQuotaText' : undefined)
}

/** Remplacer l'écran courant (« Rejouer » depuis un résultat) au lieu d'empiler : Quitter ne ramène pas à l'ancien résultat. */
type LaunchOptions = { replace?: boolean }

/** Suite d'un lancement réussi pour l'appelant (fermer sa feuille). */
type Then = { onSuccess?: () => void }

/** Entraînement contre le robot : la salle bot se prépare, puis le duel s'ouvre. */
export function useStartTraining({ replace = false }: LaunchOptions = {}) {
  const navigate = useNavigate()
  const onError = useBotRoomError()
  const create = useCreateBotRoom()
  return {
    isPending: create.isPending,
    start: (topic: PlayTopic, difficulty: BotDifficulty, then: Then = {}) =>
      create.mutate(
        { topicId: topic.topicId, difficulty },
        {
          onSuccess: ({ id }) => {
            then.onSuccess?.()
            void navigate(ROUTES.room(id), { state: { topic }, replace })
          },
          onError,
        },
      ),
  }
}

/** « Défier le monde » : ticket d'appariement, puis l'écran de recherche. */
export function useStartMatchmaking({ replace = false }: LaunchOptions = {}) {
  const navigate = useNavigate()
  const fail = useLaunchError()
  const enqueue = useEnqueueMatchmaking()
  return {
    isPending: enqueue.isPending,
    start: (topic: PlayTopic, then: Then = {}) =>
      enqueue.mutate(topic.topicId, {
        onSuccess: (ticket) => {
          then.onSuccess?.()
          void navigate(ROUTES.play(ticket.ticketId), { state: { topic }, replace })
        },
        onError: () => fail('play.matchmakingError'),
      }),
  }
}

/** Salon privé à partager par lien. */
export function useCreatePrivateRoom() {
  const navigate = useNavigate()
  const fail = useLaunchError()
  const quota = useQuotaDialog()
  const create = useCreateRoom()
  return {
    isPending: create.isPending,
    start: (topic: PlayTopic, then: Then = {}) =>
      create.mutate(
        { topicId: topic.topicId },
        {
          onSuccess: ({ id }) => {
            then.onSuccess?.()
            void navigate(ROUTES.room(id), { state: { topic } })
          },
          onError: (error) => {
            if (!quota(error)) fail('play.roomError')
          },
        },
      ),
  }
}

/** Défi nominatif : une salle `INVITED`, que l'invité accepte depuis ses Défis. */
export function useChallengePlayer() {
  const t = useT()
  const fail = useLaunchError()
  const quota = useQuotaDialog()
  const challenge = useCreateChallenge()
  return {
    isPending: challenge.isPending,
    start: ({ topic, opponent }: { topic: PlayTopic; opponent: { userId: string; pseudonym: string } }) =>
      challenge.mutate(
        { topicId: topic.topicId, opponentId: opponent.userId },
        {
          onSuccess: () => toast.success(t('play.challengeSent'), `${opponent.pseudonym} · ${topic.name}`),
          onError: (error) => {
            if (!quota(error)) fail('play.challengeError')
          },
        },
      ),
  }
}

/* ───────────── Présence ───────────── */

/** Canal de présence d'un salon (`parties.md`) : abonné = dans le salon. Le serveur observe l'abonnement. */
const roomPresenceChannel = (roomId: string) => `/topic/rooms/${roomId}/presence`
/** Canal de présence d'un ticket : quitter l'écran ou perdre la connexion annule la recherche côté serveur. */
const ticketPresenceChannel = (ticketId: string) => `/topic/matchmaking/tickets/${ticketId}/presence`

/**
 * Présence dans le salon tant que l'écran est ouvert : l'app s'abonne au canal de présence et le serveur en déduit
 * l'entrée, la sortie (écran quitté) et la déconnexion (après une grâce). Rien n'est déclaré par l'app. Un refus
 * d'entrée arrive par `useJoinRefusal` ; « Réessayer » se réabonne.
 */
export function useRoomPresence(roomId: string) {
  const [attempt, setAttempt] = useState(0)
  const [refusal, setRefusal] = useState<{ attempt: number; refusal: JoinRefusal } | null>(null)
  useJoinRefusal(roomId || undefined, (next) => setRefusal({ attempt, refusal: next }))
  useEffect(() => {
    if (!roomId) return
    return subscribeStomp(roomPresenceChannel(roomId), () => undefined)
  }, [roomId, attempt])
  const current = refusal?.attempt === attempt ? refusal.refusal : null
  return { refusal: current, retry: () => setAttempt((value) => value + 1) }
}

/** Recherche en cours tant que l'écran est ouvert : le quitter (ou perdre la connexion) l'annule côté serveur. */
export function useTicketPresence(ticketId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !ticketId) return
    return subscribeStomp(ticketPresenceChannel(ticketId), () => undefined)
  }, [ticketId, enabled])
}
