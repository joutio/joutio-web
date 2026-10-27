import { useEffect, useRef } from "react"
import { subscribeStomp, type IMessage } from "@/lib/ws"

/**
 * Abonne un composant à une destination STOMP le temps de son montage.
 * La connexion est mutualisée par service et partagée entre abonnements.
 * `destination` à `null` désactive l'abonnement.
 */
export function useStompSubscription(
  service: string,
  destination: string | null,
  onMessage: (message: IMessage) => void
): void {
  const handlerRef = useRef(onMessage)

  useEffect(() => {
    handlerRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!destination) return
    return subscribeStomp(service, destination, (message) =>
      handlerRef.current(message)
    )
  }, [service, destination])
}
