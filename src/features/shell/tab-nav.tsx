import { useLocation, useNavigate } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { BottomNav } from '@/ui'
import { useTabBadges } from './tab-badges'
import { TABS, type TabKey } from './tabs'

/**
 * Bottom nav des onglets : une URL par onglet. Toucher un onglet ouvre sa racine, y compris l'onglet actif depuis une
 * page poussée (fiche joueur ouverte depuis Social → Social, 2026-11-16) ; à la racine, il appelle `onReselect`
 * (remonter en haut).
 */
export function TabNav({ active, onReselect }: { active: TabKey; onReselect?: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const badges = useTabBadges((state) => state.badges)
  return (
    <BottomNav
      items={TABS.map((item) => ({ key: item.key, label: t(item.label), icon: item.icon, badge: badges[item.key] }))}
      active={active}
      onChange={(key) => {
        const path = TABS.find((item) => item.key === key)!.path
        if (key === active && pathname === path) onReselect?.()
        else void navigate(path)
      }}
    />
  )
}
