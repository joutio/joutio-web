import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Suggestion } from "../domain/suggestion"

/** Suggestions de la palette ⌘K : sujets + joueurs. */
export const suggestionsService = {
  list: (q: string, limit = 8): Promise<Suggestion[]> =>
    api.get<Suggestion[]>(ENDPOINTS.suggestions, { params: { q, limit } }),
}
