import { WarningCircleIcon } from '@phosphor-icons/react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { TabNav } from '@/features/shell'
import { formatNumber } from '@/features/topic'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { Button, EmptyState, MobileTopBar, RewardCard, Screen, Skeleton, Stat, Streak, StreakCalendar, type RewardCardProps } from '@/ui'
import { useMyActivity, useMyBadges, useMyRewards } from '../hooks/use-profile'
import { calendarOf, streakHint, weekOf } from '../lib/streak'

const MICAH = 'MICAH_AVATAR'

/**
 * Série (`profil.md` § 2) : compteur et semaine, En cours / Record / Jours actifs, calendrier du mois et récompense
 * Micah en lecture seule. Un jour compte dès qu'un duel entre joueurs est terminé ; un jour manqué remet à zéro.
 */
export function StreakPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const me = useMe().data
  const activity = useMyActivity()
  const rewards = useMyRewards()
  const badges = useMyBadges()
  const preview = useUserAvatar(me ? { userId: me.userId, avatarOptions: JSON.stringify({ style: 'micah' }) } : undefined)
  const data = activity.data
  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.me, { replace: true }))

  // Micah : récompense du badge d'assiduité, ou Premium (`AvatarEntitlementPolicy`, comme le mobile).
  const reward = rewards.data?.rewards.find((item) => item.code === MICAH)
  const premium = me?.premium ?? false
  const unlocked = premium || reward?.unlocked === true || (me?.rewards ?? []).includes(MICAH)
  const condition = reward?.condition
  const badge = condition ? badges.data?.families.flatMap((family) => family.badges).find((item) => item.code === condition.badgeCode) : undefined
  const target = badge?.target ?? condition?.target ?? 7
  const done = Math.min(badge?.progress ?? 0, target)
  const rule = t('streak.micahRule', { badge: condition?.badgeLabel ?? t('streak.micahBadge'), count: formatNumber(condition?.target ?? 7, language) })
  const micah: RewardCardProps = unlocked
    ? { title: 'Micah', state: 'unlocked', rule }
    : { title: 'Micah', state: 'locked', rule, progress: Math.round((done / Math.max(1, target)) * 100), progressLabel: t('streak.progress', { done, target }) }

  return (
    <Screen header={<MobileTopBar variant="inline" back={t('nav.profile')} title={t('profile.streak')} onBack={back} />} bottomNav={<TabNav active="profile" />}>
      <div className="grid gap-4 px-4 pt-1 pb-8">
        {activity.isPending ? (
          <>
            <Skeleton shape="card" />
            <Skeleton shape="card" className="h-72" />
          </>
        ) : activity.isError || !data ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('streak.error')}
            description={t('home.errorText')}
            action={
              <Button loading={activity.isRefetching} onClick={() => void activity.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : (
          <>
            <div className="rounded-jo-lg bg-jo-surface p-4">
              <Streak count={data.currentStreak} hint={streakHint(data, t)} week={weekOf(data)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label={t('streak.current')} value={formatNumber(data.currentStreak, language)} tone="accent" compact />
              <Stat label={t('streak.best')} value={formatNumber(data.longestStreak, language)} compact />
              <Stat label={t('streak.activeDays')} value={formatNumber(data.totalActiveDays, language)} compact />
            </div>
            <div className="rounded-jo-lg bg-jo-surface p-4">
              <StreakCalendar {...calendarOf(data, t, language)} />
            </div>
            {rewards.isPending || badges.isPending ? <Skeleton shape="card" /> : <RewardCard {...micah} image={preview} />}
          </>
        )}
      </div>
    </Screen>
  )
}
