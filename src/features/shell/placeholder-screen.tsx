import { HourglassIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useT } from '@/lib/i18n'
import { BottomNav, EmptyState, MobileTopBar, Screen } from '@/ui'
import { TABS, type TabKey } from './tabs'

/** Onglet dont l'écran n'est pas encore porté (étape 4 du kit) : la navigation et le cadre sont réels. */
export function PlaceholderScreen({ tab }: { tab: TabKey }) {
  const t = useT()
  const navigate = useNavigate()
  const current = TABS.find((item) => item.key === tab)!
  return (
    <Screen
      header={<MobileTopBar title={t(current.label)} />}
      bottomNav={
        <BottomNav
          items={TABS.map((item) => ({ key: item.key, label: t(item.label), icon: item.icon }))}
          active={tab}
          onChange={(key) => void navigate(TABS.find((item) => item.key === key)!.path)}
        />
      }
    >
      <EmptyState icon={HourglassIcon} title={t(current.label)} description={t('common.comingSoon')} className="pt-16" />
    </Screen>
  )
}
