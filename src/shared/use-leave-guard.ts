import { useCallback, useEffect, useRef } from 'react'
import { useBlocker, type BlockerFunction } from 'react-router-dom'

/**
 * Commande envoyée quand le joueur quitte l'écran (retour du navigateur, lien, `navigate`), et seulement alors.
 * Rattachée à la navigation plutôt qu'au démontage : un remontage (StrictMode) n'envoie rien, une sortie la porte
 * toujours. `shouldLeave` est lu à l'instant de la navigation (des refs à jour, pas l'état du dernier rendu).
 * La fermeture de l'onglet n'est pas une navigation : le serveur reprend la main (présence, expiration).
 */
export function useLeaveGuard(shouldLeave: () => boolean, onLeave: () => void) {
  const shouldLeaveRef = useRef(shouldLeave)
  const onLeaveRef = useRef(onLeave)
  useEffect(() => {
    shouldLeaveRef.current = shouldLeave
    onLeaveRef.current = onLeave
  })

  const block = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && shouldLeaveRef.current(),
    [],
  )
  const blocker = useBlocker(block)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    onLeaveRef.current()
    blocker.proceed()
  }, [blocker])
}
