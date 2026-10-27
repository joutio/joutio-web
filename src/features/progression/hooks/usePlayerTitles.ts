import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { progressionService } from "../lib/progression"

/**
 * Titres thématiques d'un joueur : libellés des titres débloqués et **clé du titre porté**.
 * C'est cette vue qui porte le libellé affiché sur le profil (le serveur ne compose pas
 * « Or · Histoire », il expose le palier et le sujet).
 */
export function usePlayerTitles(userId: string) {
  return useQuery({
    queryKey: queryKeys.profiles.titles(userId),
    queryFn: () => progressionService.titles(userId),
    enabled: userId !== "",
    staleTime: 60 * 1000,
    // Le titre porté peut changer depuis une autre surface (fiche sujet) : on relit la vue à
    // chaque montage du profil plutôt que de servir un cache « frais » mais périmé.
    refetchOnMount: "always",
  })
}
