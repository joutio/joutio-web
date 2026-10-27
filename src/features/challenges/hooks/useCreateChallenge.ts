import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { queryKeys } from "@/lib/query-keys"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import { showSuccessToast } from "@/shared/utils/success-toast"
import type { ChallengeView } from "../domain/challenge"
import { challengesService } from "../lib/challenges"

/** Paramètres de création : `gameId` renseigné = revanche d'une partie terminée. */
export interface CreateChallengeParams {
  topicId: string
  opponentId: string
  gameId?: string | null
}

/**
 * Crée un **défi nominatif** (intention asynchrone : toast + suivi sur la page Défis & Salons).
 * Le toast est **cliquable** et ouvre `/challenges` filtré sur les défis envoyés ; l'acceptation
 * mène toujours à la **salle** créée par la saga, jamais à la partie d'origine.
 */
export function useCreateChallenge() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateChallengeParams) =>
      challengesService.create(params),
    onSuccess: async (created) => {
      // Retour immédiat à l'utilisateur ; la navigation de l'appelant (`mutate(..., { onSuccess })`)
      // est exécutée **après** ce callback par React Query : elle attend donc la convergence.
      showSuccessToast(t("game.toasts.challengeSent"), {
        onClick: () => void navigate("/challenges?type=sent"),
      })

      // La projection Axon du défi peut être en retard sur la réponse `201`. On relit la liste
      // via le service jusqu'à voir le défi créé, puis on écrit cette liste convergée dans le
      // cache (la page Défis & Salons la lit telle quelle). Sinon, invalidation de secours.
      const mineKey = queryKeys.challenges.mine()
      await reconcileUntil<ChallengeView[]>({
        read: () => challengesService.mine(),
        matches: (challenges) =>
          challenges.some((challenge) => challenge.challengeId === created.id),
        onConverged: (challenges) => {
          void queryClient.cancelQueries({ queryKey: mineKey })
          queryClient.setQueryData(mineKey, challenges)
        },
        onTimeout: () =>
          void queryClient.invalidateQueries({ queryKey: mineKey }),
      })
    },
  })
}
