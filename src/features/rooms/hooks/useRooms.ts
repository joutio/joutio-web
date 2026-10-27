import { useEffect, useRef, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { useImmersiveNavigate } from "@/features/shell"
import type { ApiError } from "@/shared/types/api"
import type { RoomView } from "../domain/room"
import {
  reconcileUntil,
  removeMatchingFromList,
} from "@/shared/utils/optimistic-reconcile"
import { roomsService } from "../lib/rooms"

/** Invalide la liste après convergence (ou en secours au timeout). */
function invalidateRooms(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
}

/**
 * Convergence de l'annulation : la projection peut encore exposer la salle ~2 s — on n'invalide
 * qu'une fois qu'elle a réellement disparu (sinon la carte réapparaît et l'annulation semble
 * nécessiter deux clics). Aucune lecture périmée n'est écrite dans le cache.
 */
function reconcileRooms(
  queryClient: ReturnType<typeof useQueryClient>,
  roomId: string
): void {
  void reconcileUntil<RoomView[]>({
    read: () => roomsService.mine(),
    matches: (rooms) => !rooms.some((room) => room.roomId === roomId),
    onConverged: () => invalidateRooms(queryClient),
    onTimeout: () => invalidateRooms(queryClient),
  })
}

/** Crée une **salle partagée** (lien `/join/{id}`) et ouvre directement la salle. */
export function useCreateSharedRoom() {
  const navigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicId: string) => roomsService.create(topicId),
    onSuccess: (created) => {
      // La projection Axon peut exposer la salle avec un léger retard : une invalidation
      // immédiate relit l'ancienne liste et la carte n'apparaît qu'au prochain poll (15 s).
      // On converge jusqu'à voir la salle, puis on écrit la liste confirmée dans le cache.
      void reconcileUntil<RoomView[]>({
        read: () => roomsService.mine(),
        matches: (rooms) => rooms.some((room) => room.roomId === created.id),
        onConverged: (rooms) => {
          queryClient.setQueryData(queryKeys.rooms.mine(), rooms)
        },
        onTimeout: () => invalidateRooms(queryClient),
      })
      navigate(`/rooms/${created.id}`)
    },
  })
}

/**
 * Annule une salle (initiateur) : retrait **optimiste** de la liste « Tes salons en attente »,
 * restauration en cas d'échec et réconciliation différée avec la projection Axon (elle peut
 * encore exposer la salle ~2 s — sans délai, la carte réapparaît et l'annulation semble
 * nécessiter deux clics).
 */
export function useCancelRoom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roomId: string) => roomsService.cancel(roomId),
    onMutate: async (roomId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rooms.mine() })
      const previous = queryClient.getQueryData<RoomView[]>(
        queryKeys.rooms.mine()
      )
      removeMatchingFromList<RoomView>(
        queryClient,
        queryKeys.rooms.mine(),
        (room) => room.roomId === roomId
      )
      return { previous }
    },
    onError: (_error, _roomId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.rooms.mine(), context.previous)
      }
    },
    onSettled: (_data, error, roomId) => {
      if (error) return
      reconcileRooms(queryClient, roomId)
    },
  })
}

/**
 * Quitte / annule la salle : retour natif (pas de redirection artificielle). L'annulation
 * retire immédiatement la salle de la liste d'accueil (« Défi en attente ») ; une simple
 * sortie (« Retour ») la laisse ouverte, la carte reste.
 */
export function useLeaveRoom(roomId: string, cancel = false) {
  const goBack = useGoBack()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      cancel ? roomsService.cancel(roomId) : roomsService.leave(roomId),
    onMutate: async () => {
      if (!cancel) return undefined
      await queryClient.cancelQueries({ queryKey: queryKeys.rooms.mine() })
      const previous = queryClient.getQueryData<RoomView[]>(
        queryKeys.rooms.mine()
      )
      removeMatchingFromList<RoomView>(
        queryClient,
        queryKeys.rooms.mine(),
        (room) => room.roomId === roomId
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (cancel && context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.rooms.mine(), context.previous)
      }
    },
    onSuccess: () => {
      if (cancel) reconcileRooms(queryClient, roomId)
      goBack()
    },
  })
}

/** Cadence de reprise de l'apparition (projection Axon en retard / erreur transitoire). */
const JOIN_RETRY_BASE_MS = 400
const JOIN_RETRY_MAX_MS = 2_000
const JOIN_MAX_ATTEMPTS = 12

/** Une erreur transitoire de salle peut être rejouée ; un refus métier ne l'est jamais. */
function isRetryableJoinError(error: unknown): boolean {
  const status = (error as ApiError | undefined)?.statusCode
  if (status == null) return true
  return status === 404 || status === 408 || status >= 500
}

export interface RoomJoinState {
  /** Toutes les tentatives ont échoué : proposer un nouvel essai à l'utilisateur. */
  failed: boolean
  /** Relance la boucle d'apparition (bouton « Réessayer »). */
  retry: () => void
}

/**
 * **Apparition** dans la salle au montage : la commande unique porte la présence et, pour le
 * second humain, l'enregistrement comme participant. Le client seul la déclenche — aucune saga
 * ne le fait à sa place. **Aucun `leave` au démontage** : quitter l'écran ne ferme pas la salle.
 *
 * <p>Deux garde-fous :</p>
 * <ul>
 *   <li>retry borné tant que la salle n'est pas encore créée/lisible (projection Axon en retard
 *       après une acceptation de défi ou une création de salle bot) — aucun `joined` ref
 *       bloquant, donc le retry survit au double montage StrictMode ;</li>
 *   <li>après un succès, `onJoined` rejoue l'historique REST de la salle : la trame
 *       `ROOM_ENTERED` peut avoir été manquée entre le snapshot REST et la souscription STOMP,
 *       et sans cette réconciliation l'anneau de présence resterait gris.</li>
 * </ul>
 */
export function useRoomJoin(
  roomId: string,
  onJoined?: () => void
): RoomJoinState {
  const [failedRoomId, setFailedRoomId] = useState<string | null>(null)
  const failed = failedRoomId === roomId
  const [retryToken, setRetryToken] = useState(0)
  // Le callback de réconciliation ne doit jamais relancer la boucle : on garde la dernière
  // version dans une ref (le parent peut recréer la fonction sans effet de bord).
  const onJoinedRef = useRef(onJoined)
  useEffect(() => {
    onJoinedRef.current = onJoined
  }, [onJoined])

  useEffect(() => {
    if (!roomId) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let attempt = 0

    const join = (): void => {
      void roomsService.join(roomId).then(
        () => {
          if (!cancelled) onJoinedRef.current?.()
        },
        (error: unknown) => {
          if (cancelled) return
          if (
            !isRetryableJoinError(error) ||
            attempt >= JOIN_MAX_ATTEMPTS - 1
          ) {
            setFailedRoomId(roomId)
            return
          }
          attempt += 1
          const delay = Math.min(
            JOIN_RETRY_BASE_MS * 2 ** Math.min(attempt - 1, 2),
            JOIN_RETRY_MAX_MS
          )
          timer = setTimeout(join, delay)
        }
      )
    }
    join()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [roomId, retryToken])

  return {
    failed,
    retry: () => {
      setFailedRoomId(null)
      setRetryToken((token) => token + 1)
    },
  }
}
