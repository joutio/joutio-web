import type { CSSProperties } from "react"
import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const ICONS = {
  success: <CircleCheck className="size-5" />,
  error: <CircleX className="size-5" />,
  warning: <TriangleAlert className="size-5" />,
  info: <Info className="size-5" />,
  loading: <LoaderCircle className="size-5 animate-spin" />,
}

/** Décalage haut : sous la topbar (hauteur du device + encoche + marge), sans la recouvrir. */
const TOP_OFFSET = {
  top: "calc(var(--qu-safe-top) + var(--topbar-h) + 0.75rem)",
} as const

/**
 * Toaster applicatif (sonner) — rendu calqué sur HeroUI v3 : carte surface arrondie,
 * icône + titre teintés par variante, description muted, fermeture révélée au survol
 * (toujours visible sur mobile), pile centrée en haut sous la topbar et **toujours déployée**
 * (`expand` : aucune carte réduite, toutes à la même taille). Thème piloté par l'appelant.
 * Les toasts sont **custom** (`ToastCard`) : sonner ne leur applique pas `width: var(--width)`,
 * la largeur de colonne est donc imposée dans `src/index.css` (`[data-styled="false"]`).
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      closeButton
      gap={12}
      offset={TOP_OFFSET}
      mobileOffset={TOP_OFFSET}
      visibleToasts={3}
      // Pile toujours déployée : aucune carte réduite, toutes à la même taille réelle.
      expand
      icons={ICONS}
      style={{ "--width": "520px" } as CSSProperties}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-[26px]! bg-toast! text-toast-foreground! px-5! py-4! gap-3! shadow-toast! items-start! border-0!",
          title: "text-base! leading-6! font-semibold!",
          description: "text-sm! leading-5! text-toast-muted!",
          icon: "mt-0.5",
          success:
            "[&_[data-title]]:text-toast-success! [&_[data-icon]]:text-toast-success!",
          error:
            "[&_[data-title]]:text-toast-danger! [&_[data-icon]]:text-toast-danger!",
          warning:
            "[&_[data-title]]:text-toast-warning! [&_[data-icon]]:text-toast-warning!",
          info: "[&_[data-title]]:text-toast-accent! [&_[data-icon]]:text-toast-accent!",
          closeButton:
            "touch:hidden! size-8! rounded-full! border! border-toast-border! bg-toast! left-auto! right-0! top-0! transform-none! translate-x-[20%]! -translate-y-[20%]! opacity-100 desktop:pointer-events-none desktop:opacity-0 desktop:group-hover:pointer-events-auto desktop:group-hover:opacity-100 focus-visible:opacity-100 [&_svg]:size-3!",
        },
      }}
      {...props}
    />
  )
}
