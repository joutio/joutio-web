import type { ReactNode } from "react"
import { MotionConfig, motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

const LABEL_WIDTH = 84

export interface BottomNavItem {
  id: string
  label: string
  icon: LucideIcon
  /** Badge optionnel (compteur de non-lues…) rendu en pastille sur l'icône. */
  badge?: ReactNode
}

export type BottomNavVariant = "floating" | "fixed"

interface BottomNavBarProps {
  items: BottomNavItem[]
  /** Id de l'onglet actif (dérivé de la route par le conteneur). */
  activeId: string | null
  onSelect: (id: string) => void
  /** Masquée pendant le scroll vers le bas (glisse hors écran). */
  hidden?: boolean
  /** `fixed` : barre pleine largeur collée en bas (défaut) ; `floating` : pilule centrée. */
  variant?: BottomNavVariant
  className?: string
}

/**
 * Barre de navigation basse mobile — adaptée du composant 21st.dev « bottom-nav-bar »
 * (Arunachalam). Deux habillages partagent la même logique (état actif + navigation fournis
 * par le conteneur) : `floating` (pilule en verre dépoli, libellé qui se déploie sur l'actif)
 * et `fixed` (barre classique, libellés toujours visibles, onglets équilibrés).
 */
export function BottomNavBar({
  items,
  activeId,
  onSelect,
  hidden = false,
  variant = "fixed",
  className,
}: BottomNavBarProps) {
  const { t } = useTranslation()
  const floating = variant === "floating"

  return (
    <MotionConfig reducedMotion="user">
      <motion.nav
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: hidden ? 0 : 1,
          y: hidden ? 96 : 0,
        }}
        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
        role="navigation"
        aria-label={t("shared.navigation.aria")}
        aria-hidden={hidden}
        className={cn(
          "fixed inset-x-0 z-30 hidden compact:flex",
          floating
            ? "bottom-[var(--bottom-nav-offset)] mx-auto h-(--bottom-nav-h) w-fit max-w-[95vw] items-center gap-1 rounded-full border border-border/60 bg-card/70 p-2 shadow-xl backdrop-blur-xl supports-[backdrop-filter]:bg-card/60"
            : "bottom-0 h-[calc(var(--bottom-nav-h)+var(--qu-safe-bottom))] items-stretch border-t border-border/60 bg-card/85 pb-[var(--qu-safe-bottom)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/75",
          hidden && "pointer-events-none",
          className
        )}
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeId === item.id

          if (!floating) {
            return (
              <motion.button
                key={item.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-200",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="relative">
                  <Icon size={24} strokeWidth={2} aria-hidden />
                  {item.badge}
                </span>
                <span className="max-w-full truncate text-xs font-medium select-none">
                  {item.label}
                </span>
              </motion.button>
            )
          }

          return (
            <motion.button
              key={item.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-16 min-h-16 min-w-11 items-center rounded-full px-2.5 py-2 transition-colors duration-200",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                isActive
                  ? "gap-2 bg-primary/10 text-primary"
                  : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="relative">
                <Icon size={24} strokeWidth={2} aria-hidden />
                {item.badge}
              </span>

              <motion.div
                initial={false}
                animate={{
                  width: isActive ? `${LABEL_WIDTH}px` : "0px",
                  opacity: isActive ? 1 : 0,
                }}
                transition={{
                  // Tween sans rebond : les onglets voisins glissent sans « jingle ».
                  type: "tween",
                  duration: 0.22,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="flex max-w-[84px] items-center overflow-hidden"
              >
                <span
                  title={item.label}
                  className={cn(
                    "overflow-hidden text-xs leading-[1.9] font-medium text-ellipsis whitespace-nowrap select-none",
                    isActive ? "text-primary" : "opacity-0"
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </motion.button>
          )
        })}
      </motion.nav>
    </MotionConfig>
  )
}
