import { QueryClient } from '@tanstack/react-query'
import { isApiError } from './api/api-error'

/**
 * Client React Query unique. Les données se rafraîchissent par les notifications temps réel (invalidations ciblées),
 * pas par polling ni au retour de focus. Une erreur 4xx ne se rejoue pas ; réseau et 5xx, deux fois.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failures, error) => (isApiError(error) && !error.transient ? false : failures < 2),
    },
    mutations: { retry: false },
  },
})
