import { useNavigate } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { BottomNav } from '@/ui'
import { useTabBadges } from './tab-badges'
import { TABS, type TabKey } from './tabs'

/** Bottom nav des onglets : une URL par onglet. Toucher l'onglet actif appelle `onReselect` (remonter en haut). */
export function TabNav({ active, onReselect }: { active: TabKey; onReselect?: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const badges = useTabBadges((state) => state.badges)
  return (
    <BottomNav
      items={TABS.map((item) => ({ key: item.key, label: t(item.label), icon: item.icon, badge: badges[item.key] }))}
      active={active}
      onChange={(key) => {
        if (key === active) onReselect?.()
        else void navigate(TABS.find((item) => item.key === key)!.path)
      }}
    />
  )
}
