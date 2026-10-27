import { useEffect, useMemo, useState } from "react"
import { getSessionUserId } from "@/features/auth"
import { useMyChallenges } from "@/features/challenges"
import { useMyOpenRooms } from "@/features/rooms"
import { useServerClock } from "@/shared/clock/useServerClock"
import {
  isPendingActive,
  splitPendingChallenges,
  toReceivedDuel,
  toRoomDuel,
  toSentDuel,
  type PendingDuel,
  type ReceivedDuel,
} from "../domain/pending-duel"

export interface SocialPending {
  /** Invitations reçues, en cartes empilées comme les défis envoyés. */
  received: ReceivedDuel[]
  /** Défis envoyés en attente (annulables). */
  sent: PendingDuel[]
  /** Salons ouverts (à ouvrir / annuler). */
  rooms: PendingDuel[]
  /** Total en attente — pastille de navigation (reçus + envoyés + salons). */
  total: number
  isLoading: boolean
}

/**
 * Tout ce qui attend une action du joueur (défis reçus/envoyés, salons ouverts), partagé par
 * la page Défis & Salons et la pastille de navigation « Défis ». Les deux listes sont déjà
 * rafraîchies en direct (STOMP) et par polling : aucune requête supplémentaire n'est émise.
 */
export function useSocialPending(): SocialPending {
  const me = getSessionUserId()
  const challenges = useMyChallenges()
  const openRooms = useMyOpenRooms()
  const { serverNow } = useServerClock()
  const [, refresh] = useState(0)

  const { received, sent, rooms } = useMemo(() => {
    const split = splitPendingChallenges(challenges.data ?? [], me)
    return {
      received: split.received.map(toReceivedDuel),
      sent: split.sent.map(toSentDuel),
      rooms: (openRooms.data ?? []).map(toRoomDuel),
    }
  }, [challenges.data, me, openRooms.data])

  // Une carte disparaît exactement à son échéance serveur, sans attendre le poll de 15 s.
  const now = serverNow()
  const nextExpiry = useMemo(
    () =>
      [...received, ...sent, ...rooms]
        .filter((item) => isPendingActive(item, now))
        .reduce<number | null>((nearest, item) => {
          const expiresAt = Date.parse(item.expiresAt)
          if (!Number.isFinite(expiresAt)) return nearest
          return nearest == null || expiresAt < nearest ? expiresAt : nearest
        }, null),
    [now, received, rooms, sent]
  )

  useEffect(() => {
    if (nextExpiry == null) return
    const timer = window.setTimeout(
      () => refresh((value) => value + 1),
      Math.max(0, nextExpiry - serverNow()) + 50
    )
    return () => window.clearTimeout(timer)
  }, [nextExpiry, serverNow])

  return useMemo(() => {
    const activeReceived = received.filter((item) => isPendingActive(item, now))
    const activeSent = sent.filter((item) => isPendingActive(item, now))
    const activeRooms = rooms.filter((item) => isPendingActive(item, now))
    return {
      received: activeReceived,
      sent: activeSent,
      rooms: activeRooms,
      total: activeReceived.length + activeSent.length + activeRooms.length,
      isLoading: challenges.isLoading || openRooms.isLoading,
    }
  }, [challenges.isLoading, now, openRooms.isLoading, received, rooms, sent])
}
