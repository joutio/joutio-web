import { useQuery } from '@tanstack/react-query'
import { homeQuery } from '@joutio/client/query'
import { api } from '@/lib/api'

export function useHome() {
  return useQuery({ ...homeQuery(api), staleTime: 60_000 })
}
