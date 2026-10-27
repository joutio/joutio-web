import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import { createRoomStream } from "../application/room-repository"
import { emptyRoom, type Room } from "../domain/room"

interface UseRoomResult {
  room: Room
  isLoading: boolean
  isError: boolean
  /** Rejoue l'historique REST (réconciliation après apparition, filet anti-trame manquée). */
  refresh: () => void
}

/**
 * État d'une salle, reconstruit par fold des notifications (historique REST + WebSocket).
 */
export function useRoom(roomId: string): UseRoomResult {
  const stream = useMemo(() => createRoomStream(roomId), [roomId])
  const fallback = useMemo(() => emptyRoom(roomId), [roomId])

  useEffect(() => {
    stream.start()
    return () => stream.stop()
  }, [stream])

  const room =
    useSyncExternalStore(
      stream.subscribe,
      stream.getSnapshot,
      stream.getSnapshot
    ) ?? fallback
  const refresh = useCallback(() => stream.refresh(), [stream])

  return {
    room,
    isLoading: !stream.isLoaded() && !stream.hasLoadError(),
    isError: stream.hasLoadError(),
    refresh,
  }
}
