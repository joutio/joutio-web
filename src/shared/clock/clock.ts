import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { ServerTime } from "./types"

/** Horloge serveur — synchronisation des chronos de l'arène. */
export const clockService = {
  get: (): Promise<ServerTime> => api.get<ServerTime>(ENDPOINTS.clock),
}
