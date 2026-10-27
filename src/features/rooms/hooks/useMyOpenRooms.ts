import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { roomsService } from "../lib/rooms"

/** Vue mutable (salons en attente) : rafraîchissement périodique + tolérance alignée. */
const ROOMS_POLL_MS = 15_000

/** Salles ouvertes du joueur (défi envoyé en attente, lien partagé). */
export function useMyOpenRooms() {
  return useQuery({
    queryKey: queryKeys.rooms.mine(),
    queryFn: () => roomsService.mine(),
    staleTime: ROOMS_POLL_MS,
    refetchInterval: ROOMS_POLL_MS,
  })
}
