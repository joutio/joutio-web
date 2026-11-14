import {
  BellIcon,
  CrownSimpleIcon,
  GameControllerIcon,
  LifebuoyIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UserCircleIcon,
} from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { showPremium } from '@/features/premium'
import { useT } from '@/lib/i18n'
import { logout } from '@/lib/session'
import { showDialog } from '@/shared/dialog'
import { ROUTES, type SettingsPage as Category } from '@/shared/routes'
import { ListRow, Notice } from '@/ui'
import { useSettingsOrigin } from '../lib/settings-options'
import { Group, SettingsScreen } from './settings-screen'

/**
 * Réglages (`design/specs/screens/reglages.md` § 1, refonte du 2026-11-13) : racine de catégories, ouverte par la roue
 * dentée du Profil ou de l'Accueil. Carte Premium, catégories (une page chacune), Création et Inviter, Aide, puis Se
 * déconnecter. Les champs publics du profil sont dans Éditer le profil.
 */
export function SettingsPage() {
  const t = useT()
  const navigate = useNavigate()
  const from = useSettingsOrigin()
  const me = useMe().data
  const open = (page: Category) => () => void navigate(ROUTES.settingsPage(page), { state: { from } })

  const confirmLogout = () =>
    showDialog({
      sheet: true,
      icon: SignOutIcon,
      title: t('settings.logoutTitle'),
      message: t('settings.logoutText'),
      actions: [
        { label: t('settings.logout'), variant: 'tinted', tone: 'destructive', onClick: () => void logout() },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  return (
    <SettingsScreen title={t('profile.settings')} root>
      <Notice
        tone={me?.premium ? 'success' : 'live'}
        icon={CrownSimpleIcon}
        title={t(me?.premium ? 'settings.premiumCardActive' : 'settings.premiumCard')}
        message={t(me?.premium ? 'settings.premiumCardActiveText' : 'settings.premiumCardText')}
        action={{ label: t(me?.premium ? 'settings.premiumManage' : 'settings.premiumDiscover'), onClick: () => showPremium() }}
      />
      <Group>
        <ListRow icon={UserCircleIcon} label={t('settings.account')} sub={t('settings.accountSub')} control="chevron" onClick={open('account')} />
        <ListRow icon={ShieldCheckIcon} label={t('settings.privacyCategory')} control="chevron" onClick={open('privacy')} />
        <ListRow icon={BellIcon} label={t('home.notifications')} control="chevron" onClick={open('notifications')} />
        <ListRow icon={GameControllerIcon} label={t('settings.game')} sub={t('settings.gameSub')} control="chevron" onClick={open('game')} />
        <ListRow icon={PaletteIcon} label={t('settings.display')} control="chevron" onClick={open('display')} last />
      </Group>
      <Group>
        <ListRow icon={LifebuoyIcon} label={t('settings.help')} control="chevron" onClick={open('help')} last />
      </Group>
      <Group>
        <ListRow icon={SignOutIcon} label={t('settings.logout')} control="none" destructive onClick={confirmLogout} last />
      </Group>
    </SettingsScreen>
  )
}
