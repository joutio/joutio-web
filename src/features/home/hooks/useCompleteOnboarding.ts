import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import type { Me } from "@/features/shell/domain/me"
import { onboardingService } from "../lib/onboarding"

interface CompleteOnboardingVariables {
  /**
   * Intérêts qui viennent d'être enregistrés (y compris une liste vide pour un effacement).
   * Permet de ne pas réécrire une projection profile encore en retard dans le cache.
   */
  interests?: string[]
}

/** Pose le flag serveur une seule fois ; la vue `me` est mise à jour pour le guard. */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient()
  return useMutation<Me, Error, CompleteOnboardingVariables | undefined>({
    mutationFn: () => onboardingService.complete(),
    onSuccess: (me, variables) => {
      // Pas d'invalidation immédiate : la projection profile peut être en retard sur la réponse
      // du BFF (qui force déjà `onboardingCompleted=true`) et réécrire un flag faux dans le cache.
      // Si des intérêts viennent d'être enregistrés, ils font foi (même une liste vide).
      const expectedInterests = variables?.interests
      queryClient.setQueryData<Me>(queryKeys.me(), (old) => ({
        ...me,
        onboardingCompleted: true,
        interests:
          expectedInterests !== undefined
            ? expectedInterests
            : (me.interests ?? old?.interests ?? []),
      }))
    },
  })
}
