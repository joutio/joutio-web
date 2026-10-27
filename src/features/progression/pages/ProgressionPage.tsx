import { Navigate } from "react-router-dom"

/**
 * Page « Progression » **retirée** : la collection de badges vit dans l'onglet Badges du
 * profil, les titres dans les Réglages (et l'onglet Titres d'une fiche sujet). Redirection
 * conservée pour les liens et favoris existants.
 */
export function ProgressionPage() {
  return <Navigate to="/profile?tab=badges" replace />
}
