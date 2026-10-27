import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  BottomNavBar,
  type BottomNavItem,
} from "@/components/ui/bottom-nav-bar"
import { useSocialPending } from "@/features/social"
import { useTextInputFocus } from "@/shared/hooks/useTextInputFocus"
import { useBottomNavStore } from "../stores/useBottomNavStore"
import { useChromeStore } from "../stores/useChromeStore"
import { NavBadge } from "./NavBadge"
import { MOBILE_NAV, isNavItemActive } from "./navigation"

/** Barre de navigation basse mobile : routeur + pastille du pending (défis et salons). */
export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const variant = useBottomNavStore((state) => state.variant)
  const pending = useSocialPending()
  // Seule cette barre consomme l'état du chrome en React : la page n'est pas re-rendue.
  const hidden = useChromeStore((state) => state.hidden)
  // Clavier mobile ouvert (champ texte focalisé) : la nav serait recouverte, on la masque.
  const keyboardOpen = useTextInputFocus()

  if (keyboardOpen) {
    return null
  }

  const activeId =
    MOBILE_NAV.find((item) => isNavItemActive(item, pathname))?.id ?? null

  const items: BottomNavItem[] = MOBILE_NAV.map((item) => ({
    id: item.id,
    label: t(item.labelKey),
    icon: item.icon,
    badge:
      item.id === "challenges" ? <NavBadge count={pending.total} /> : undefined,
  }))

  return (
    <BottomNavBar
      items={items}
      activeId={activeId}
      hidden={hidden}
      variant={variant}
      onSelect={(id) => {
        const item = MOBILE_NAV.find((entry) => entry.id === id)
        if (item) void navigate(item.path)
      }}
    />
  )
}
