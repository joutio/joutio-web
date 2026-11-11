import { HourglassIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useT, type MessageKey } from '@/lib/i18n'
import { EmptyState, MobileTopBar, Screen } from '@/ui'
import { TabNav } from './tab-nav'
import { TABS, type TabKey } from './tabs'

/** Onglet dont l'écran n'est pas encore porté (étape 4 du kit) : la navigation et le cadre sont réels. */
export function PlaceholderScreen({ tab }: { tab: TabKey }) {
  const t = useT()
  const current = TABS.find((item) => item.key === tab)!
  return (
    <Screen header={<MobileTopBar title={t(current.label)} />} bottomNav={<TabNav active={tab} />}>
      <EmptyState icon={HourglassIcon} title={t(current.label)} description={t('common.comingSoon')} className="pt-16" />
    </Screen>
  )
}

/** Écran poussé pas encore porté (fiche sujet, notifications, recherche) : retour par l'historique. */
export function PendingScreen({ title }: { title: MessageKey }) {
  const t = useT()
  const navigate = useNavigate()
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate('/', { replace: true }))
  return (
    <Screen header={<MobileTopBar variant="inline" title={t(title)} back={t('nav.home')} onBack={back} />}>
      <EmptyState icon={HourglassIcon} title={t(title)} description={t('common.comingSoon')} className="pt-16" />
    </Screen>
  )
}
