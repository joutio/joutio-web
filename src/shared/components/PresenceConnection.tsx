import { useEffect } from "react"
import { retainStompConnection } from "@/lib/ws"
import { useSession } from "@/features/auth"

/**
 * Maintient la connexion STOMP `profile` ouverte pour toute session authentifiée, quelle que
 * soit la route (y compris l'arène et la salle, rendus hors de la coquille applicative).
 * Le `CONNECT` authentifié (JWT) est le signal de présence côté serveur ; les heartbeats STOMP
 * détectent les clients morts, et la connexion est fermée proprement dès que l'onglet n'est
 * plus visible (cf. `lib/ws`).
 */
export function PresenceConnection() {
  const { authenticated } = useSession()

  useEffect(() => {
    if (!authenticated) return
    return retainStompConnection("profile")
  }, [authenticated])

  return null
}
