import type { LucideIcon } from "lucide-react"
import { toast } from "sonner"
import {
  ToastCard,
  type ToastActor,
  type ToastTone,
} from "@/shared/components/toast-card"

export interface ShowToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Icône du visuel de tête ; à défaut, celle du ton (jamais de toast sans visuel). */
  icon?: LucideIcon
  /** Acteur : son avatar remplace la pastille d'icône (présence, abonnement). */
  actor?: ToastActor | null
  /** Action du clic — le toast se ferme **toujours** après (ex. ouvrir la cible d'une notification). */
  onClick?: () => void
  /** Toast cliquable **sans** action : le clic ne fait que le fermer (ex. « X est en ligne »). */
  dismissOnClick?: boolean
  /** Identifiant stable : une même clé remplace le toast précédent au lieu de l'empiler. */
  id?: string | number
  duration?: number
}

/**
 * Ferme un toast par son identifiant stable (ex. notification supprimée en temps réel).
 * Passe par le même point d'entrée que `showToast` : `sonner` reste confiné à ce module.
 */
export function dismissToast(id?: string | number): void {
  toast.dismiss(id)
}

/**
 * **Gabarit unique des toasts** : tous les toasts de l'app passent par ici (`ToastCard` rendu par
 * `toast.custom`) — visuel de tête et titre obligatoires, description optionnelle, même largeur
 * (colonne du `Toaster`, pleine largeur en mobile). La hauteur **suit le contenu** : titre et
 * description s'affichent en entier, sans ligne tronquée. Le clic ferme toujours le toast, puis
 * déclenche `onClick` s'il y en a un. `sonner` n'est importé que par ce module et le `Toaster`
 * (ESLint).
 */
export function showToast({
  title,
  description,
  tone = null,
  icon,
  actor = null,
  onClick,
  dismissOnClick = false,
  id,
  duration,
}: ShowToastOptions): void {
  const clickable = onClick !== undefined || dismissOnClick
  toast.custom(
    (toastId) => (
      <ToastCard
        title={title}
        description={description}
        tone={tone}
        icon={icon}
        actor={actor}
        onClick={
          clickable
            ? () => {
                toast.dismiss(toastId)
                onClick?.()
              }
            : undefined
        }
      />
    ),
    { id, duration }
  )
}
