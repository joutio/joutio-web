import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { suggestionsService } from "../lib/suggestions"

const SUGGESTIONS_STALE_MS = 60 * 1000
const MIN_QUERY_LENGTH = 2

/** Suggestions de la palette ⌘K (sujets + joueurs), composées par le BFF. */
export function useSuggestions(query: string, enabled: boolean, limit = 8) {
  const q = query.trim()
  return useQuery({
    queryKey: queryKeys.suggestions(q, limit),
    queryFn: () => suggestionsService.list(q, limit),
    enabled: enabled && q.length >= MIN_QUERY_LENGTH,
    staleTime: SUGGESTIONS_STALE_MS,
  })
}
