import {
  ArrowCounterClockwiseIcon,
  BellSlashIcon,
  CakeIcon,
  CheckCircleIcon,
  CrownSimpleIcon,
  DatabaseIcon,
  EnvelopeSimpleIcon,
  FileTextIcon,
  GlobeHemisphereWestIcon,
  InfoIcon,
  LifebuoyIcon,
  LightningIcon,
  MedalIcon,
  PaletteIcon,
  ProhibitIcon,
  RobotIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SpeakerHighIcon,
  TrashIcon,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useAutoTrain } from '@/features/play'
import { showPremium } from '@/features/premium'
import { config } from '@/lib/config'
import { useLanguageStore, useT } from '@/lib/i18n'
import { enablePush, pushPermission, type PushAvailability } from '@/lib/push'
import { useThemeStore } from '@/lib/theme'
import { useDeviceSettings } from '@/shared/device-settings'
import { ROUTES, type SettingsPage } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { Button, CategoryTile, ListRow, MobileSheet, Notice, RadioGroup, tokens, type CategoryCode } from '@/ui'
import { useNotificationPreferences, useSetNotificationPreference, useUpdateMe } from '../hooks/use-settings'
import { MAX_INTERESTS } from '../lib/settings-service'
import { BirthDateSheet } from './birth-date-sheet'
import { APPEARANCE, LANGUAGES, useSettingsOrigin } from '../lib/settings-options'
import { Group, SettingsScreen } from './settings-screen'

const PAGES: readonly SettingsPage[] = ['account', 'privacy', 'notifications', 'game', 'display', 'help']
const SUPPORT = 'mailto:contact@joutio.com'
const UNIVERSES = Object.keys(tokens.category) as CategoryCode[]

const openSite = (path: string) => () => window.open(`${config.siteUrl}${path}`, '_blank', 'noopener')

/** Une catégorie des Réglages (`reglages.md` § 1, Pages), retour « Réglages ». */
export function SettingsCategoryPage() {
  const page = useParams().page as SettingsPage | undefined
  if (!page || !PAGES.includes(page)) return <Navigate to={ROUTES.settings} replace />
  switch (page) {
    case 'account':
      return <AccountPage />
    case 'privacy':
      return <PrivacyPage />
    case 'notifications':
      return <NotificationsPage />
    case 'game':
      return <GamePage />
    case 'display':
      return <DisplayPage />
    case 'help':
      return <HelpPage />
  }
}

function AccountPage() {
  const t = useT()
  const navigate = useNavigate()
  const from = useSettingsOrigin()
  const language = useLanguageStore((state) => state.language)
  const me = useMe().data
  const [birthOpen, setBirthOpen] = useState(false)
  const birthDate = me?.birthDate ? new Date(`${me.birthDate}T12:00:00`).toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric' }) : t('account.birthDateEmpty')
  return (
    <SettingsScreen title={t('settings.account')} overlay={<BirthDateSheet open={birthOpen} value={me?.birthDate} onClose={() => setBirthOpen(false)} />}>
      <Group title={t('account.connection')}>
        <ListRow icon={EnvelopeSimpleIcon} label={t('account.email')} value={me?.email} control="value" last />
      </Group>
      <Group footer={t('account.birthDateFooter')}>
        <ListRow icon={CakeIcon} label={t('account.birthDate')} value={birthDate} control="chevron" onClick={() => setBirthOpen(true)} last />
      </Group>
      <Group>
        <ListRow icon={CrownSimpleIcon} label="Premium" value={t(me?.premium ? 'settings.premiumActive' : 'settings.premiumSoon')} control="chevron" onClick={() => showPremium()} last />
      </Group>
      <Group>
        <ListRow icon={TrashIcon} label={t('settings.deleteAccount')} control="none" destructive onClick={() => void navigate(ROUTES.deleteAccount, { state: { from } })} last />
      </Group>
    </SettingsScreen>
  )
}

function PrivacyPage() {
  const t = useT()
  return (
    <SettingsScreen title={t('settings.privacyCategory')}>
      <Group title={t('privacy.players')}>
        <ListRow icon={ProhibitIcon} label={t('privacy.blocked')} value={t('settings.premiumSoon')} control="value" disabled last />
      </Group>
      <Group title={t('privacy.data')}>
        <ListRow icon={ShieldCheckIcon} label={t('privacy.policy')} control="chevron" onClick={openSite('/privacy')} />
        <ListRow icon={DatabaseIcon} label={t('privacy.myData')} sub={t('privacy.myDataSub')} control="chevron" onClick={openSite('/data-deletion')} last />
      </Group>
    </SettingsScreen>
  )
}

function NotificationsPage() {
  const t = useT()
  const device = useDeviceSettings()
  const preferences = useNotificationPreferences()
  const setPreference = useSetNotificationPreference()
  const [push, setPush] = useState<PushAvailability>(pushPermission)
  const [enabling, setEnabling] = useState(false)
  const rooms = preferences.data?.find((item) => item.category === 'ROOM')?.enabled ?? true

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

  return (
    <SettingsScreen title={t('home.notifications')}>
      {(push === 'default' || push === 'denied') && (
        <Notice
          tone="info"
          icon={BellSlashIcon}
          title={t('settings.pushOff')}
          message={t('settings.pushOffText')}
          action={push === 'default' ? { label: t('settings.pushEnable'), onClick: () => void activatePush(), loading: enabling } : undefined}
        />
      )}
      <Group title={t('notifications.when')}>
        <ListRow icon={LightningIcon} label={t('settings.notifyChallenges')} sub={t('notifications.challengesSub')} control="toggle" on={rooms} onToggle={(on) => setPreference.mutate({ category: 'ROOM', enabled: on })} />
        <ListRow icon={ArrowCounterClockwiseIcon} label={t('settings.notifyRematches')} sub={t('notifications.rematchesSub')} control="toggle" on={device.rematches} onToggle={(on) => device.set('rematches', on)} />
        <ListRow icon={MedalIcon} label={t('settings.notifyRanks')} sub={t('notifications.ranksSub')} control="toggle" on={device.ranks} onToggle={(on) => device.set('ranks', on)} last />
      </Group>
    </SettingsScreen>
  )
}

function GamePage() {
  const t = useT()
  const me = useMe().data
  const device = useDeviceSettings()
  const autoTrain = useAutoTrain()
  const saveInterests = useUpdateMe('interests')
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>([])
  const interests = me?.interests ?? []
  const toggle = (category: string) => setDraft(draft.includes(category) ? draft.filter((item) => item !== category) : [...draft, category])

  return (
    <SettingsScreen
      title={t('settings.game')}
      overlay={
        <MobileSheet
          open={open}
          onClose={() => setOpen(false)}
          title={t('settings.interests')}
          subtitle={t('settings.interestsCount', { count: draft.length, max: MAX_INTERESTS })}
          tall
          footer={
            <Button full disabled={draft.join() === interests.join()} loading={saveInterests.isPending} onClick={() => saveInterests.mutate(draft, { onSuccess: () => setOpen(false) })}>
              {t('settings.save')}
            </Button>
          }
        >
          <div className="grid gap-3">
            <p className="jo-type-callout m-0 text-pretty text-jo-muted">{t('settings.interestsText')}</p>
            <div className="grid grid-cols-3 gap-2">
              {UNIVERSES.map((category) => {
                const on = draft.includes(category)
                return <CategoryTile key={category} category={category} selected={on} disabled={draft.length === MAX_INTERESTS && !on} onToggle={() => toggle(category)} />
              })}
            </div>
          </div>
        </MobileSheet>
      }
    >
      <Group title={t('settings.duel')}>
        <ListRow icon={SpeakerHighIcon} label={t('settings.sound')} control="toggle" on={device.sound} onToggle={(on) => device.set('sound', on)} />
        <ListRow icon={CheckCircleIcon} label={t('settings.answerDetails')} sub={t('settings.answerDetailsSub')} control="toggle" on={device.answerDetails} onToggle={(on) => device.set('answerDetails', on)} last />
      </Group>
      <Group title={t('game.matchmaking')}>
        <ListRow icon={RobotIcon} label={t('settings.autoTrain')} sub={t('settings.autoTrainSub')} control="toggle" on={autoTrain.enabled} onToggle={autoTrain.set} last />
      </Group>
      <Group title={t('nav.home')}>
        <ListRow
          icon={SparkleIcon}
          label={t('settings.interests')}
          sub={interests.map((category) => tokens.category[category as CategoryCode]?.label ?? category).join(', ') || t('settings.interestsEmpty')}
          control="chevron"
          onClick={() => {
            setDraft(interests)
            setOpen(true)
          }}
          last
        />
      </Group>
    </SettingsScreen>
  )
}

function DisplayPage() {
  const t = useT()
  const me = useMe().data
  const theme = useThemeStore()
  const saveLanguage = useUpdateMe('language')
  const [sheet, setSheet] = useState<'language' | 'appearance'>()
  return (
    <SettingsScreen
      title={t('settings.display')}
      overlay={
        <>
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
      <Group>
        <ListRow icon={GlobeHemisphereWestIcon} label={t('settings.language')} value={LANGUAGES.find((option) => option.value === me?.language)?.label} control="chevron" onClick={() => setSheet('language')} />
        <ListRow
          icon={PaletteIcon}
          label={t('settings.appearance')}
          value={t(APPEARANCE.find((option) => option.value === theme.preference)?.label ?? 'settings.system')}
          control="chevron"
          onClick={() => setSheet('appearance')}
          last
        />
      </Group>
    </SettingsScreen>
  )
}

function HelpPage() {
  const t = useT()
  return (
    <SettingsScreen title={t('settings.help')}>
      <Group>
        <ListRow icon={LifebuoyIcon} label={t('help.support')} control="chevron" onClick={() => window.open(SUPPORT, '_self')} />
        <ListRow icon={FileTextIcon} label={t('settings.terms')} control="chevron" onClick={openSite('/terms')} />
        <ListRow icon={ShieldCheckIcon} label={t('privacy.policy')} control="chevron" onClick={openSite('/privacy')} last />
      </Group>
      <Group>
        <ListRow icon={InfoIcon} label={t('help.version')} value={config.version} control="value" last />
      </Group>
    </SettingsScreen>
  )
}
