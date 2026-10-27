import { useEffect } from "react"
import { apiErrorBus } from "@/lib/error-bus"
import { apiErrorToast } from "@/shared/utils/api-error-toast"
import { showToast } from "@/shared/utils/toast"
import { endSession, useSessionStore } from "@/features/auth"

/** Type RFC 7807 émis par le BFF quand le `user_id` du JWT n'existe plus (base réinitialisée). */
const UNKNOWN_USER_TYPE = "urn:joutio:authentification:unknownUser"
/** Compte suspendu : le BFF refuse l'accès même avec un JWT encore valide. */
const ACCOUNT_SUSPENDED_TYPE = "urn:joutio:authorization:accountSuspended"

/**
 * Relaie les erreurs du client HTTP vers des toasts (sonner).
 *
 * Un `401` n'est jamais toasté (le cycle de session s'en charge) :
 * - `unknownUser` (JWT valide mais compte disparu côté identity, ex. reset du service) → fin de
 *   session avec la raison dédiée, **une fois par session** (garde sur l'état authentifié, pas
 *   sur une vie d'onglet : une session suivante doit pouvoir être terminée à son tour) ;
 * - tout autre 401 (access expiré, refresh transitoire) → silencieux : le renouvellement piloté
 *   (`useSessionRefresh` / rejeu du client HTTP) retentera sans purger la session.
 */
export function ErrorToasterBridge() {
  useEffect(
    () =>
      apiErrorBus.subscribe((error) => {
        if (error.statusCode === 403 && error.type === ACCOUNT_SUSPENDED_TYPE) {
          if (useSessionStore.getState().user !== null) {
            void endSession("suspended")
          }
          return
        }
        if (error.statusCode === 401) {
          if (
            error.type === UNKNOWN_USER_TYPE &&
            useSessionStore.getState().user !== null
          ) {
            void endSession("unknownUser")
          }
          return
        }
        const { title, description } = apiErrorToast(error)
        showToast({ tone: "danger", title, description })
      }),
    []
  )

  return null
}
