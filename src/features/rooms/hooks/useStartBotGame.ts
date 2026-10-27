import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { useImmersiveNavigate } from "@/features/shell"
import type { BotDifficulty } from "@/features/game/domain/game-dto"
import { roomsService } from "../lib/rooms"

/**
 * Ouvre une salle contre le bot et redirige vers le salon : le bot y est joint automatiquement,
 * le joueur y **apparaît** puis la partie est créée (la salle est l'unique point d'entrée de
 * préparation d'une partie).
 */
export function useStartBotGame() {
  const navigate = useImmersiveNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { topicId: string; difficulty: BotDifficulty }) =>
      roomsService.createBot(input.topicId, input.difficulty),
    onSuccess: (response) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms.mine() })
      navigate(`/rooms/${response.id}`)
    },
  })
}
