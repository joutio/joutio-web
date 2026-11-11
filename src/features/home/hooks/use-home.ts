import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { homeService } from '../lib/home-service'

export function useHome() {
  return useQuery({ queryKey: queryKeys.home, queryFn: homeService.get, staleTime: 60_000 })
}
