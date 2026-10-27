import { createApiClient } from "./api-client"
import { config } from "./config"
import { sessionGateway } from "./session"
import { apiErrorBus } from "./error-bus"
import { reportClientError } from "./telemetry"

export const api = createApiClient({
  baseUrl: config.apiUrl,
  defaultTimeoutMs: 15_000,
  getAuthToken: () => sessionGateway.getAccessToken(),
  onUnauthorized: () => sessionGateway.refresh(),
  onError: (error) => {
    // 404 : souvent transitoire (projections en lecture différée). 408 : timeout réseau,
    // géré localement par l'écran concerné (retry/feedback). 401 : géré (purge locale) par l'UI.
    const status = error.statusCode ?? 0
    if (import.meta.env.DEV) {
      if (status === 404 || status === 408) {
        console.debug(`[API] ${status} (ignoré): ${error.message}`)
      } else {
        console.error(`[API] ${error.statusCode ?? "?"}: ${error.message}`)
      }
    }
    if (status >= 500) {
      reportClientError(new Error(error.message || "Erreur serveur"), {
        type: "API_ERROR",
        source: `api:${status}`,
      })
    }
    if (status !== 404 && status !== 408) {
      apiErrorBus.publish({
        statusCode: error.statusCode,
        message: error.message || "Une erreur est survenue",
        detail: error.detail,
        type: error.type,
      })
    }
  },
})
