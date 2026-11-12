import { useNavigate } from 'react-router-dom'

/** Retour d'un écran poussé : l'historique s'il existe, sinon l'écran parent (lien profond ouvert directement). */
export function useBack(parent: string) {
  const navigate = useNavigate()
  return () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(parent, { replace: true }))
}
