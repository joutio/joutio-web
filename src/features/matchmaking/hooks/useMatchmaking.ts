import { useEffect, useMemo, useSyncExternalStore } from "react"
import { useMutation } from "@tanstack/react-query"
import { useImmersiveNavigate } from "@/features/shell"
import { matchmakingService } from "../lib/matchmaking"
import { createMatchmakingStream } from "../application/matchmaking-repository"
import { emptyMatchmaking, type Matchmaking } from "../domain/matchmaking"

/** Entre en recherche d'appariement public et ouvre l'écran de recherche. */
export function useStartMatchmaking() {
  const navigate = useImmersiveNavigate()
  return useMutation({
    mutationFn: (topicId: string) => matchmakingService.enqueue(topicId),
    onSuccess: (ticket) => navigate(`/matchmaking/${ticket.ticketId}`),
  })
}

export function useCancelMatchmaking(ticketId: string) {
  return useMutation({
    mutationFn: () => matchmakingService.cancel(ticketId),
  })
}

interface UseMatchmakingResult {
  ticket: Matchmaking
  isLoading: boolean
  isError: boolean
}

/** État d'une recherche, reconstruit par fold des notifications (REST + WebSocket). */
export function useMatchmakingTicket(ticketId: string): UseMatchmakingResult {
  const stream = useMemo(() => createMatchmakingStream(ticketId), [ticketId])
  const fallback = useMemo(() => emptyMatchmaking(ticketId), [ticketId])

  useEffect(() => {
    stream.start()
    return () => stream.stop()
  }, [stream])

  const ticket =
    useSyncExternalStore(
      stream.subscribe,
      stream.getSnapshot,
      stream.getSnapshot
    ) ?? fallback

  return {
    ticket,
    isLoading: !stream.isLoaded() && !stream.hasLoadError(),
    isError: stream.hasLoadError(),
  }
}
