export interface ApiErrorEvent {
  statusCode?: number
  message: string
  detail?: string
  /** URI d'identification du problème RFC 7807 (ex. `urn:joutio:challenge:…`). */
  type?: string
}

type Listener = (event: ApiErrorEvent) => void

const listeners = new Set<Listener>()

/**
 * Bus minimal d'erreurs API : la couche `lib` (agnostique React) publie, un composant
 * d'UI s'abonne pour afficher un toast. Évite de coupler le client HTTP à l'UI.
 */
export const apiErrorBus = {
  publish(event: ApiErrorEvent): void {
    listeners.forEach((listener) => listener(event))
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
