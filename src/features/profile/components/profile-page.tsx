import { GearSixIcon, LinkIcon, MapPinIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { TabNav } from '@/features/shell'
import { formatNumber, useMyTitles } from '@/features/topic'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { countryLabel } from '@/shared/country'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toast } from '@/shared/toast'
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  IconButton,
  JoutioTabs,
  MobileSheet,
  ParallaxScreen,
  Pill,
  RankLadder,
  Skeleton,
  Stat,
  TabsScrollView,
  TitleRibbon,
  tokens,
  type TierCode,
} from '@/ui'
import type { BadgeFamilySummary } from '../lib/badges'
import { RANKS, rankRule, titleLabel } from '../lib/ranks'
import { BadgesTab, HistoryTab, StatsTab, TitlesTab } from './profile-tabs'

type Tab = 'stats' | 'badges' | 'titles' | 'history'

const TABS: readonly { value: Tab; label: MessageKey }[] = [
  { value: 'stats', label: 'profile.tabStats' },
  { value: 'badges', label: 'profile.tabBadges' },
  { value: 'titles', label: 'profile.tabTitles' },
  { value: 'history', label: 'profile.tabHistory' },
]

/** Bannière de 336 px : avatar de 88 px, même distance sous la barre que la Fiche sujet (`profil.md` § 7). */
const HERO_HEIGHT = 336

/** Les sept rangs, le mien agrandi, les suivants verrouillés (feuille Rangs). */
function Ranks({ name, src, tier }: { name: string; src?: string; tier?: TierCode }) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const current = tier ? RANKS.indexOf(tier) : -1
  return (
    <ul className="m-0 list-none overflow-hidden rounded-jo-md p-0">
      {RANKS.map((rank, index) => {
        const mine = index === current
        return (
          <li key={rank} className={`flex items-center gap-3 px-4 py-2 ${mine ? 'bg-jo-raised' : ''}`}>
            <Avatar name={name} src={src} tier={rank} size={mine ? 'lg' : 'list'} locked={index > current} />
            <span className="grid min-w-0 flex-1">
              <strong className="jo-type-headline truncate">{tokens.tier[rank].label}</strong>
              <span className="jo-type-caption truncate text-jo-muted">{rankRule(rank, t, language)}</span>
            </span>
            {mine && <Pill>{t('profile.yourRank')}</Pill>}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Profil (`design/specs/screens/profil.md`, lab `/screens/profil?view=compact`) : bannière en parallaxe, avatar et
 * pseudonyme centrés, titre porté, rang, pays et compteurs, puis onglets Statistiques, Badges, Titres et Historique.
 * Le partage devient « Copier le lien » (`web.md`).
 */
export function ProfilePage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const me = useMe()
  const titles = useMyTitles()
  const data = me.data
  const src = useUserAvatar(data)
  const [tab, setTab] = useState<Tab>('stats')
  const [ranksOpen, setRanksOpen] = useState(false)
  const [family, setFamily] = useState<BadgeFamilySummary>()
  const [familyOpen, setFamilyOpen] = useState(false)

  const progression = data?.progression
  const tier = progression && !progression.provisional ? tierOf(progression.rating) : undefined
  const worn = titles.data?.titles.find((title) => title.key === (titles.data?.equippedKey ?? data?.equippedTitle))
  const name = data?.pseudonym ?? t('nav.profile')

  const copyLink = () => {
    if (!data) return
    void navigator.clipboard
      ?.writeText(new URL(ROUTES.player(data.userId), window.location.origin).href)
      .then(() => toast.success(t('topic.linkCopied')))
      .catch(() => toast.error(t('topic.linkError')))
  }

  if (me.isError && !data) {
    return (
      <ParallaxScreen back={false} title={t('nav.profile')} bottomNav={<TabNav active="profile" />}>
        <EmptyState
          className="pt-16"
          icon={WarningCircleIcon}
          title={t('profile.error')}
          description={t('home.errorText')}
          action={
            <Button loading={me.isRefetching} onClick={() => void me.refetch()}>
              {t('common.retry')}
            </Button>
          }
        />
      </ParallaxScreen>
    )
  }

  const counters = [
    { label: t('profile.games'), value: data?.stats ? formatNumber(data.stats.played, language) : data ? '0' : '—' },
    { label: t('profile.followers'), value: data ? formatNumber(data.followersCount, language) : '—' },
    { label: t('profile.following'), value: data ? formatNumber(data.followingCount, language) : '—' },
  ]

  return (
    <ParallaxScreen
      heroHeight={HERO_HEIGHT}
      back={false}
      centered
      image={data?.bannerUrl ?? undefined}
      title={name}
      eyebrow={data ? <Avatar name={name} src={src} tier={tier} provisional={progression?.provisional} size="xxl" /> : undefined}
      right={
        <>
          <IconButton icon={LinkIcon} label={t('profile.copyLink')} media onClick={copyLink} />
          <IconButton icon={GearSixIcon} label={t('profile.settings')} media onClick={() => void navigate(ROUTES.settings)} />
        </>
      }
      intro={
        <div className="grid gap-4">
          <div className="grid justify-items-center gap-2">
            {worn && (
              <div className="w-full min-w-0 overflow-x-auto">
                <div className="flex w-max min-w-full justify-center">
                  <TitleRibbon tier={worn.tier} text={titleLabel(worn, language)} width="auto" />
                </div>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {!data ? (
                <Skeleton className="h-7 w-40" />
              ) : tier && progression ? (
                <Badge variant="tier" tier={tier}>{`${tokens.tier[tier].label} · ${formatNumber(progression.rating, language)}`}</Badge>
              ) : (
                <Pill>{t('profile.unranked')}</Pill>
              )}
              {data?.country && <Pill icon={MapPinIcon}>{countryLabel(data.country, language)}</Pill>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {counters.map((counter) => (
              <Stat key={counter.label} {...counter} compact />
            ))}
          </div>
        </div>
      }
      sticky={<JoutioTabs label={t('profile.tabs')} options={TABS.map((item) => ({ value: item.value, label: t(item.label) }))} value={tab} onChange={setTab} />}
      bottomNav={<TabNav active="profile" />}
      overlay={
        <>
          <MobileSheet open={ranksOpen} onClose={() => setRanksOpen(false)} title={t('profile.ranks')}>
            <Ranks name={name} src={src} tier={tier} />
          </MobileSheet>
          {family && (
            <MobileSheet open={familyOpen} onClose={() => setFamilyOpen(false)} title={family.name}>
              <div className="grid gap-3">
                <p className="jo-type-callout m-0 text-center text-pretty text-jo-muted">{family.description}</p>
                <RankLadder rungs={family.rungs} icon={family.icon} />
              </div>
            </MobileSheet>
          )}
        </>
      }
    >
      {!data ? (
        <div className="grid gap-6 px-4 pt-1 pb-6" aria-label={t('home.loading')}>
          <Skeleton shape="card" />
          <Skeleton shape="card" />
        </div>
      ) : (
        <TabsScrollView
          value={tab}
          onChange={setTab}
          pages={[
            { value: 'stats', content: <StatsTab me={data} onRanks={() => setRanksOpen(true)} /> },
            {
              value: 'badges',
              content: (
                <BadgesTab
                  onOpen={(next) => {
                    setFamily(next)
                    setFamilyOpen(true)
                  }}
                />
              ),
            },
            { value: 'titles', content: <TitlesTab titles={titles.data} error={titles.isError} retrying={titles.isRefetching} onRetry={() => void titles.refetch()} /> },
            { value: 'history', content: <HistoryTab /> },
          ]}
        />
      )}
    </ParallaxScreen>
  )
}
