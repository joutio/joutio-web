import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import { meService } from "../lib/me"
import type { Me } from "../domain/me"

function sameInterests(
  current: string[] | undefined,
  expected: string[]
): boolean {
  const actual = current ?? []
  return (
    actual.length === expected.length &&
    actual.every((code, index) => code === expected[index])
  )
}

interface UpdateInterestsContext {
  previousMe?: Me
}

/**
 * Enregistre les centres d'intérêt (0 à 3 codes ordonnés) et **converge** vers la projection
 * tant que `me.interests` ne reflète pas l'intention. Utilisé par l'onboarding (avant le flag
 * de fin) et par les Réglages. L'invalidation de `home` fait apparaître le rail « Pour toi ».
 */
export function useUpdateInterests() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string[], UpdateInterestsContext>({
    mutationFn: async (interests) => {
      await meService.updateInterests(interests)
      await reconcileUntil<Me>({
        read: () => meService.get(),
        matches: (me) => sameInterests(me.interests, interests),
        onConverged: (me) => {
          queryClient.setQueryData(queryKeys.me(), me)
          void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
        },
        onTimeout: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.me() })
          void queryClient.invalidateQueries({ queryKey: queryKeys.home() })
        },
        attempts: 4,
        intervalMs: 500,
      })
    },
    onMutate: async (interests) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.me() })
      const previousMe = queryClient.getQueryData<Me>(queryKeys.me())
      queryClient.setQueryData<Me>(queryKeys.me(), (old) =>
        old ? { ...old, interests } : old
      )
      return { previousMe }
    },
    onError: (_error, _interests, context) => {
      if (context?.previousMe !== undefined) {
        queryClient.setQueryData(queryKeys.me(), context.previousMe)
      }
    },
  })
}
