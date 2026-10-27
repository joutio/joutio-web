import { useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { reconcileUntil } from "@/shared/utils/optimistic-reconcile"
import type { Me } from "@/features/shell/domain/me"
import type { PlayerTitles } from "../domain/progression"
import { progressionService } from "../lib/progression"

/**
 * Titre porté affiché sur le profil (`PUT /api/profiles/{id}/title`).
 *
 * Optimiste : la clé du titre est posée dans le cache des titres (`profiles.titles`, qui porte
 * l'affichage du profil) **et** dans `me.equippedTitle` (lu par l'onglet Titres d'une fiche
 * sujet), puis **réconciliée** par relecture du service jusqu'à ce que le serveur reflète
 * l'intention — le titre est validé côté BFF (palier réellement atteint), donc une relecture
 * périmée écraserait l'état optimiste (cf. `best-practices/.frontend/server-state.md`).
 *
 * `me` est **recopié depuis la vue de titres convergée** plutôt que réinvalidé : une relecture
 * de projection retardataire ferait clignoter la carte de titre entre « Affiché » et
 * « Débloqué ». Les autres champs de `me` n'ont pas changé ; la prochaine relecture naturelle
 * (staleTime/focus) suffit.
 */
export function useEquipTitle(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (titleKey: string | null) =>
      progressionService.equipTitle(userId, titleKey),

    onMutate: async (titleKey) => {
      if (userId === "") return {}
      await Promise.all([
        queryClient.cancelQueries({
          queryKey: queryKeys.profiles.titles(userId),
        }),
        queryClient.cancelQueries({ queryKey: queryKeys.me() }),
      ])
      const previousTitles = queryClient.getQueryData<PlayerTitles>(
        queryKeys.profiles.titles(userId)
      )
      const previousMe = queryClient.getQueryData<Me>(queryKeys.me())
      queryClient.setQueryData<PlayerTitles>(
        queryKeys.profiles.titles(userId),
        (old) => {
          if (!old) return old
          // Ne pas poser une clé sans son titre : le profil afficherait un ruban vide.
          const known =
            titleKey === null ||
            old.titles.some((title) => title.key === titleKey)
          return known ? { ...old, equippedKey: titleKey } : old
        }
      )
      queryClient.setQueryData<Me>(queryKeys.me(), (old) =>
        old ? { ...old, equippedTitle: titleKey } : old
      )
      return { previousTitles, previousMe }
    },

    onError: (_error, _titleKey, context) => {
      if (userId === "" || !context) return
      if (context.previousTitles !== undefined) {
        queryClient.setQueryData(
          queryKeys.profiles.titles(userId),
          context.previousTitles
        )
      }
      if (context.previousMe !== undefined) {
        queryClient.setQueryData(queryKeys.me(), context.previousMe)
      }
    },

    onSettled: (_data, error, titleKey) => {
      if (error || userId === "") return
      void reconcileUntil<PlayerTitles>({
        read: () => progressionService.titles(userId),
        matches: (view) =>
          view.equippedKey === titleKey &&
          (titleKey === null ||
            view.titles.some((title) => title.key === titleKey)),
        onConverged: (view) => {
          queryClient.setQueryData(queryKeys.profiles.titles(userId), view)
          queryClient.setQueryData<Me>(queryKeys.me(), (old) =>
            old ? { ...old, equippedTitle: view.equippedKey } : old
          )
        },
        onTimeout: () => {
          // La mutation a réussi : on garde `me` patché pour ne pas faire clignoter la carte.
          // Seule la vue des titres est réinvalidée (projection éventuellement en retard).
          void queryClient.invalidateQueries({
            queryKey: queryKeys.profiles.titles(userId),
          })
        },
      })
    },
  })
}
