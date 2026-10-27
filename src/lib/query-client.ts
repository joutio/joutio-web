import { QueryClient } from "@tanstack/react-query"
import type { ApiError } from "@/shared/types/api"

/**
 * On ne retente jamais une erreur client (4xx) : un 401 est déjà géré par le refresh+rejeu
 * du client HTTP, un 403/404/422 est définitif. Seules les erreurs réseau/5xx et les timeouts
 * (408) sont retentés.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  const status = (error as ApiError | undefined)?.statusCode
  if (status && status >= 400 && status < 500 && status !== 408) return false
  return failureCount < 2
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
    },
  })
}

/** Instance partagée : permet la purge du cache à la déconnexion hors composant React. */
export const queryClient = createQueryClient()
