import { activityDate, streakDayUnlocked, useActivity } from '@joutio/client/profile'
import { useCreateChallenge, useRoomStream } from '@joutio/client/rooms'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PlayTopic } from '@/features/play'
import { useT } from '@/lib/i18n'
import { readServerNow } from '@/lib/realtime'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'

/** Secondes avant une échéance serveur (affichage seulement). */
function useSecondsUntil(at: string | null) {
  const [now, setNow] = useState(readServerNow)
  useEffect(() => {
    if (!at) return
    const timer = window.setInterval(() => setNow(readServerNow()), 250)
    return () => window.clearInterval(timer)
  }, [at])
  return at ? Math.max(0, Math.ceil((Date.parse(at) - now) / 1000)) : 0
}

export type RematchState = 'idle' | 'pending' | 'refused'

/**
 * Proposer une revanche : `useCreateChallenge` avec la partie d'origine, puis la salle (`useRoomStream`) dit la réponse —
 * `WAITING_PLAYERS` ouvre le salon, `DECLINED` l'annonce, `EXPIRED` (échéance du serveur) rend le bouton. Aucune
 * minuterie locale ni GET de confirmation.
 */
export function useSendRematch({ opponentId, topic, gameId }: { opponentId: string | null; topic: PlayTopic; gameId: string }) {
  const t = useT()
  const navigate = useNavigate()
  const challenge = useCreateChallenge()
  const [roomId, setRoomId] = useState<string | null>(null)
  const { state: room, status } = useRoomStream(roomId ?? undefined)
  // Salle connue (`ROOM_CREATED` replié) : avant, l'état vide n'a pas de statut significatif.
  const known = Boolean(status?.loaded && room?.topicId)
  const roomStatus = known ? room?.status : undefined
  const seconds = useSecondsUntil(roomStatus === 'INVITED' ? (room?.expiresAt ?? null) : null)
  const settled = useRef<string | null>(null)

  useEffect(() => {
    if (!roomId || settled.current === roomId || !roomStatus || roomStatus === 'INVITED') return
    settled.current = roomId
    if (roomStatus === 'WAITING_PLAYERS') void navigate(ROUTES.room(roomId), { replace: true, state: { topic } })
    else if (roomStatus === 'DECLINED') toast.error(t('result.rematchDeclined'))
    else toast.error(t('result.rematchNoAnswer'), t('result.rematchNoAnswerText'))
  }, [roomId, roomStatus, navigate, topic, t])

  // Refusée : le bouton le dit ; expirée ou annulée : il revient, une nouvelle revanche repart d'une nouvelle salle.
  const answered = roomStatus !== undefined && roomStatus !== 'INVITED' && roomStatus !== 'WAITING_PLAYERS'
  const state: RematchState =
    roomStatus === 'DECLINED' ? 'refused' : challenge.isPending || (roomId !== null && !answered) ? 'pending' : 'idle'

  const send = () => {
    if (state !== 'idle' || !opponentId || !topic.topicId) return
    challenge.mutate(
      { topicId: topic.topicId, opponentId, gameId },
      {
        onSuccess: ({ id }) => setRoomId(id),
        onError: () => toast.error(t('result.rematchError'), t('home.errorText')),
      },
    )
  }

  return { state, seconds, sending: challenge.isPending, send }
}

/**
 * Nouveau jour de série ouvert par cette partie (2026-11-13, `resultat.md` § 1) : la fin de partie marque le profil
 * périmé (`@joutio/client`), l'activité est donc relue à l'ouverture du résultat ; seule une lecture faite après le
 * montage compte, puis la règle partagée tranche. Jamais pour un entraînement contre le bot.
 */
export function useStreakUnlock(userId: string | undefined, enabled: boolean) {
  const activity = useActivity(enabled ? userId : undefined)
  const fresh = activity.isFetchedAfterMount && activity.data !== undefined
  return {
    isFetched: !enabled || fresh || activity.isError,
    data: fresh && activity.data ? streakDayUnlocked(activity.data, activityDate(readServerNow())) : null,
  }
}
