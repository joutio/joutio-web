import { cn } from "cn"

interface BannerGlowProps {
  /** Couleur du halo — couleur du thème (fiche sujet) ; repli : primaire de l'app. */
  color?: string
  className?: string
}

/**
 * Halo radial décoratif des banners (profil, fiche sujet), posé sous le contenu du banner :
 * dégradé `125% 125% at 50% -50%` teinté par la couleur fournie (22 %, même recette que les
 * halos du duel) et fondu au transparent. Purement présentationnel — `bg-background` et le
 * contenu restent inchangés. (Les `BackgroundBeams` sont désactivés pour le moment.)
 */
export function BannerGlow({
  color = "var(--primary)",
  className,
}: BannerGlowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background: `radial-gradient(125% 125% at 50% -50%, color-mix(in srgb, ${color} 22%, transparent) 40%, transparent 100%)`,
      }}
    />
  )
}
