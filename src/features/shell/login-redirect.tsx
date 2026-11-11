import { Navigate, useLocation } from 'react-router-dom'

/** Ancienne adresse de connexion : identity y renvoie encore (`?social=success`, `?continue=`). */
export function LoginRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/welcome${search}`} replace />
}
