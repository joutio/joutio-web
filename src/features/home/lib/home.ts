import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Home } from "../domain/home"

/** Accueil (`GET /api/home`) : sujets suivis récents + sujets les plus joués. */
export const homeService = {
  get: (): Promise<Home> => api.get<Home>(ENDPOINTS.home),
}
