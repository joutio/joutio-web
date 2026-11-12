import type { Language } from '@joutio/client-domain/api-types'
import {
  ArrowCounterClockwiseIcon,
  BellSlashIcon,
  CheckCircleIcon,
  CrownSimpleIcon,
  FileTextIcon,
  GlobeHemisphereWestIcon,
  LightningIcon,
  MedalIcon,
  PaletteIcon,
  PencilSimpleIcon,
  RobotIcon,
  ShieldCheckIcon,
  SignOutIcon,
  SpeakerHighIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useAutoTrain } from '@/features/play'
import { showPremium } from '@/features/premium'
import { TabNav } from '@/features/shell'
import { config } from '@/lib/config'
import { useT, type MessageKey } from '@/lib/i18n'
import { enablePush, pushPermission, type PushAvailability } from '@/lib/push'
import { logout } from '@/lib/session'
import { useThemeStore, type ThemePreference } from '@/lib/theme'
import { useDeviceSettings } from '@/shared/device-settings'
import { showDialog } from '@/shared/dialog'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { ListRow, MobileSheet, MobileTopBar, Notice, RadioGroup, Screen, SectionHeader } from '@/ui'
import { useNotificationPreferences, useSetNotificationPreference, useUpdateMe } from '../hooks/use-settings'
import { useProfileFields } from './profile-fields'

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

const APPEARANCE: readonly { value: ThemePreference; label: MessageKey }[] = [
  { value: 'dark', label: 'settings.dark' },
  { value: 'light', label: 'settings.light' },
  { value: 'system', label: 'settings.system' },
]

/** Nom de chaque langue dans sa propre langue, comme le lab. */
const LANGUAGES: readonly { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
]

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="grid gap-3">
    <SectionHeader title={title} />
    {children}
  </section>
)

/**
 * Réglages (`design/specs/screens/reglages.md`, lab `/screens/reglages?view=compact`) : écran poussé du Profil, retour
 * « Profil », bottom nav. Profil, Langue, Apparence, Duel (sans Vibrations sur le web), Notifications (Notice tant que
 * le navigateur ne les autorise pas), Compte, puis Supprimer mon compte à part.
 */
export function SettingsPage() {
  const t = useT()
  const navigate = useNavigate()
  const me = useMe().data
  const { rows, sheets } = useProfileFields(me)
  const [sheet, setSheet] = useState<'language' | 'appearance'>()
  const theme = useThemeStore()
  const device = useDeviceSettings()
  const autoTrain = useAutoTrain()
  const saveLanguage = useUpdateMe('language')
  const preferences = useNotificationPreferences()
  const setPreference = useSetNotificationPreference()
  const [push, setPush] = useState<PushAvailability>(pushPermission)
  const [enabling, setEnabling] = useState(false)
  const rooms = preferences.data?.find((item) => item.category === 'ROOM')?.enabled ?? true
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.me, { replace: true }))

  const activatePush = async () => {
    setEnabling(true)
    try {
      const result = await enablePush()
      setPush(result)
      if (result === 'denied') toast.error(t('settings.pushDenied'), t('settings.pushDeniedText'))
    } catch {
      toast.error(t('settings.pushError'), t('home.errorText'))
    } finally {
      setEnabling(false)
    }
  }

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

  const legal = (path: string) => () => window.open(`${config.siteUrl}${path}`, '_blank', 'noopener')

  return (
    <Screen
      header={<MobileTopBar variant="inline" back={t('nav.profile')} title={t('profile.settings')} onBack={back} />}
      bottomNav={<TabNav active="profile" />}
      overlay={
        <>
          {sheets}
          <MobileSheet open={sheet === 'language'} onClose={() => setSheet(undefined)} title={t('settings.language')}>
            <RadioGroup label={t('settings.language')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
              {LANGUAGES.map((option, index) => (
                <ListRow
                  key={option.value}
                  label={option.label}
                  control="radio"
                  on={me?.language === option.value}
                  onToggle={() => {
                    if (option.value !== me?.language) saveLanguage.mutate(option.value)
                    setSheet(undefined)
                  }}
                  last={index === LANGUAGES.length - 1}
                />
              ))}
            </RadioGroup>
          </MobileSheet>
          <MobileSheet open={sheet === 'appearance'} onClose={() => setSheet(undefined)} title={t('settings.appearance')}>
            <RadioGroup label={t('settings.appearance')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
              {APPEARANCE.map((option, index) => (
                <ListRow
                  key={option.value}
                  label={t(option.label)}
                  control="radio"
                  on={theme.preference === option.value}
                  onToggle={() => {
                    theme.setPreference(option.value)
                    setSheet(undefined)
                  }}
                  last={index === APPEARANCE.length - 1}
                />
              ))}
            </RadioGroup>
          </MobileSheet>
        </>
      }
    >
      <div className="grid gap-6 px-4 pt-2 pb-8">
        <Section title={t('settings.profile')}>
          <div className={CARD}>{rows}</div>
        </Section>
        <Section title={t('settings.language')}>
          <div className={CARD}>
            <ListRow icon={GlobeHemisphereWestIcon} label={t('settings.language')} value={LANGUAGES.find((option) => option.value === me?.language)?.label} control="chevron" onClick={() => setSheet('language')} last />
          </div>
        </Section>
        <Section title={t('settings.appearance')}>
          <div className={CARD}>
            <ListRow
              icon={PaletteIcon}
              label={t('settings.appearance')}
              value={t(APPEARANCE.find((option) => option.value === theme.preference)?.label ?? 'settings.system')}
              control="chevron"
              onClick={() => setSheet('appearance')}
              last
            />
          </div>
        </Section>
        <Section title={t('settings.duel')}>
          <div className={CARD}>
            <ListRow icon={SpeakerHighIcon} label={t('settings.sound')} control="toggle" on={device.sound} onToggle={(on) => device.set('sound', on)} />
            <ListRow icon={CheckCircleIcon} label={t('settings.answerDetails')} sub={t('settings.answerDetailsSub')} control="toggle" on={device.answerDetails} onToggle={(on) => device.set('answerDetails', on)} />
            <ListRow icon={RobotIcon} label={t('settings.autoTrain')} sub={t('settings.autoTrainSub')} control="toggle" on={autoTrain.enabled} onToggle={autoTrain.set} last />
          </div>
        </Section>
        <Section title={t('home.notifications')}>
          {(push === 'default' || push === 'denied') && (
            <Notice
              tone="info"
              icon={BellSlashIcon}
              title={t('settings.pushOff')}
              message={t('settings.pushOffText')}
              action={push === 'default' ? { label: t('settings.pushEnable'), onClick: () => void activatePush(), loading: enabling } : undefined}
            />
          )}
          <div className={CARD}>
            <ListRow icon={LightningIcon} label={t('settings.notifyChallenges')} control="toggle" on={rooms} onToggle={(on) => setPreference.mutate({ category: 'ROOM', enabled: on })} />
            <ListRow icon={ArrowCounterClockwiseIcon} label={t('settings.notifyRematches')} control="toggle" on={device.rematches} onToggle={(on) => device.set('rematches', on)} />
            <ListRow icon={MedalIcon} label={t('settings.notifyRanks')} control="toggle" on={device.ranks} onToggle={(on) => device.set('ranks', on)} last />
          </div>
        </Section>
        <Section title={t('settings.account')}>
          <div className={CARD}>
            <ListRow icon={CrownSimpleIcon} label="Premium" control="chevron" value={t(me?.premium ? 'settings.premiumActive' : 'settings.premiumSoon')} onClick={() => showPremium()} />
            <ListRow icon={PencilSimpleIcon} label={t('pending.creation')} control="chevron" onClick={() => void navigate(ROUTES.myTopics)} />
            <ListRow icon={ShieldCheckIcon} label={t('settings.privacy')} control="chevron" onClick={legal('/privacy')} />
            <ListRow icon={FileTextIcon} label={t('settings.terms')} control="chevron" onClick={legal('/terms')} />
            <ListRow icon={SignOutIcon} label={t('settings.logout')} control="none" destructive onClick={confirmLogout} last />
          </div>
          <div className={CARD}>
            <ListRow icon={TrashIcon} label={t('settings.deleteAccount')} control="none" destructive onClick={() => void navigate(ROUTES.deleteAccount)} last />
          </div>
        </Section>
      </div>
    </Screen>
  )
}
