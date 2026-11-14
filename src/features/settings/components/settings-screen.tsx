import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TabNav, TABS } from '@/features/shell'
import { useT } from '@/lib/i18n'
import { ROUTES } from '@/shared/routes'
import { MobileTopBar, Screen, SectionHeader } from '@/ui'
import { CARD, useSettingsOrigin } from '../lib/settings-options'

/**
 * Cadre d'une page des Réglages : barre avec retour (« Profil » ou « Accueil » à la racine, « Réglages » dans une
 * catégorie) et bottom nav sur l'onglet d'origine.
 */
export function SettingsScreen({ title, root = false, overlay, children }: { title: string; root?: boolean; overlay?: ReactNode; children: ReactNode }) {
  const t = useT()
  const navigate = useNavigate()
  const from = useSettingsOrigin()
  const origin = TABS.find((tab) => tab.key === from)
  const parent = root ? (origin?.path ?? ROUTES.me) : ROUTES.settings
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(parent, { replace: true, state: { from } }))
  const label = root ? t(origin?.label ?? 'nav.profile') : t('profile.settings')
  return (
    <Screen header={<MobileTopBar variant="inline" back={label} title={title} onBack={back} />} bottomNav={<TabNav active={from} />} overlay={overlay}>
      <div className="grid gap-6 px-4 pt-2 pb-8">{children}</div>
    </Screen>
  )
}

export function Group({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="grid gap-2">
      {title && <SectionHeader title={title} />}
      <div className={CARD}>{children}</div>
      {footer && <p className="jo-type-caption m-0 px-1 text-pretty text-jo-muted">{footer}</p>}
    </section>
  )
}
