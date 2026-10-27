import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { getSessionUserId } from "@/features/auth"
import { playNotificationChime } from "@/shared/audio"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import { triggerScreenNudge } from "@/shared/utils/nudge"
import { WIZZ_COOLDOWN_MS, wizzState, type Room } from "../domain/room"
import { roomsService } from "../lib/rooms"

/**
 * Relance (« wizz ») de l'adversaire absent : pur temps réel, cadence 10 s côté serveur. La
 * confirmation d'envoi est locale — secousse de la fenêtre de l'émetteur (façon MSN) et motif
 * « wizz » (interrupteur « Sons » respecté) ; un refus serveur reste toasté par le bus d'erreurs.
 */
export function useWizzRoom(roomId: string, onSent?: () => void) {
  const soundEnabled = useSoundStore((s) => s.enabled)
  return useMutation({
    mutationFn: () => roomsService.wizz(roomId),
    onSuccess: () => {
      onSent?.()
      triggerScreenNudge()
      if (soundEnabled) playNotificationChime("WIZZ")
    },
  })
}

export interface RoomWizz {
  /** Bouton actif : salle nominative en attente, adversaire absent, cadence écoulée. */
  available: boolean
  /** Secondes restantes avant la prochaine relance (0 = disponible). */
  cooldownSeconds: number
  send: () => void
  pending: boolean
}

/**
 * État du bouton « Wizzer » : disponibilité dérivée du fold (rejouée au rechargement via
 * l'historique REST), décompte ré-échantillonné sur l'horloge serveur pendant la cadence, et
 * cadence **optimiste** posée dès l'envoi (le fold la reprend à la réception de la trame).
 */
export function useRoomWizz(room: Room, roomId: string): RoomWizz {
  const meId = getSessionUserId()
  const { serverNow } = useServerClock()
  const [nowMs, setNowMs] = useState(() => serverNow())
  const [sentAtMs, setSentAtMs] = useState<number | null>(null)
  const wizz = useWizzRoom(roomId, () => setSentAtMs(serverNow()))

  const state = useMemo(() => wizzState(room, meId, nowMs), [room, meId, nowMs])
  const cooldownEndsAt = useMemo(() => {
    const optimisticEndsAt =
      sentAtMs === null ? null : sentAtMs + WIZZ_COOLDOWN_MS
    if (state.cooldownEndsAt === null) return optimisticEndsAt
    if (optimisticEndsAt === null) return state.cooldownEndsAt
    return Math.max(state.cooldownEndsAt, optimisticEndsAt)
  }, [state.cooldownEndsAt, sentAtMs])

  const remainingMs =
    cooldownEndsAt === null ? 0 : Math.max(0, cooldownEndsAt - nowMs)
  const cooling = remainingMs > 0

  useEffect(() => {
    // Décompte du bouton : un échantillon court suffit (l'échéance reste serveur).
    if (!cooling) return
    const timer = setInterval(() => setNowMs(serverNow()), 250)
    return () => clearInterval(timer)
  }, [cooling, serverNow])

  return {
    available: state.available && !cooling,
    cooldownSeconds: cooling ? Math.max(1, Math.ceil(remainingMs / 1000)) : 0,
    send: () => {
      if (!wizz.isPending && state.available && !cooling) wizz.mutate()
    },
    pending: wizz.isPending,
  }
}
