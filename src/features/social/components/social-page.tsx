import type { PeopleSort, PlayerCardView } from '@joutio/client/profile'
import { useContacts } from '@joutio/client/social'
import { MagnifyingGlassIcon, SlidersHorizontalIcon, SwordIcon, UsersThreeIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useMe } from '@joutio/client/me'
import { usePlayerIdentity } from '@/features/me'
import { NotificationBell } from '@/features/notifications'
import { SettingsButton } from '@/features/settings'
import { useChallengePlayer } from '@/features/play'
import { ChallengeTopicSheet, relativeSeen } from '@/features/player'
import { TabNav } from '@/features/shell'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { selectUserId, useSessionStore } from '@/lib/session'
import { feedFooterProps } from '@/shared/paging'
import { CHALLENGES_TABS, ROUTES, type ChallengesTab } from '@/shared/routes'
import { useTabParam } from '@/shared/use-tab-param'
import { tierOf } from '@/shared/tier'
import { topicName } from '@/shared/topics'
import { useDebounced } from '@/shared/use-debounced'
import { Button, EmptyState, FeedFooter, IconButton, JoutioTabs, ListRow, MobileSheet, MobileTopBar, PlayerRow, RadioGroup, Screen, SearchField, Skeleton, TabsScrollView } from '@/ui'

type Tab = 'following' | 'followers'

/** Tri de l'annuaire (`social.md` § 2) : Présence par défaut, pour les deux onglets. */
const SORTS: readonly { value: PeopleSort; label: MessageKey }[] = [
  { value: 'PRESENCE', label: 'social.sortPresence' },
  { value: 'RECENT', label: 'social.sortRecent' },
  { value: 'ELO', label: 'social.sortElo' },
  { value: 'ALPHA', label: 'social.sortAlpha' },
]
const DEFAULT_SORT: PeopleSort = 'PRESENCE'

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

function Loading() {
  const t = useT()
  return (
    <div className="grid gap-2 px-4 pt-1 pb-6" aria-label={t('common.loading')}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Skeleton key={index} shape="row" className="h-16" />
      ))}
    </div>
  )
}

/** Ligne d'un contact : la ligne ouvre la fiche, l'épée ouvre le choix du sujet. */
function ContactRow({ player, last, onChallenge }: { player: PlayerCardView; last: boolean; onChallenge: (player: PlayerCardView) => void }) {
  const t = useT()
  const navigate = useNavigate()
  const src = useUserAvatar(player)
  const identity = usePlayerIdentity()
  const online = player.presence?.status === 'ONLINE'
  const sub = online ? t('presence.online') : player.presence?.lastSeenAt ? capitalize(relativeSeen(player.presence.lastSeenAt, t)) : t('presence.offline')
  return (
    <PlayerRow
      name={player.pseudonym}
      premium={identity.premium(player)}
      src={src}
      tier={tierOf(player.rating)}
      presence={online ? 'online' : 'offline'}
      sub={sub}
      ctaIcon={{ icon: SwordIcon, label: t('social.challengeName', { name: player.pseudonym }), onClick: () => onChallenge(player) }}
      onClick={() => void navigate(ROUTES.player(player.userId))}
      last={last}
    />
  )
}

function Players({ tab, query, sort, onChallenge }: { tab: Tab; query: string; sort: PeopleSort; onChallenge: (player: PlayerCardView) => void }) {
  const t = useT()
  const list = useContacts({ userId: useSessionStore(selectUserId) ?? undefined, direction: tab, query, sort })
  const players = (list.data?.pages.flatMap((page) => page.content) ?? [])
  if (list.isPending) return <Loading />
  if (list.isError && !list.isFetchNextPageError)
    return (
      <EmptyState
        icon={WarningCircleIcon}
        title={t('social.errorTitle')}
        description={t('home.errorText')}
        action={
          <Button loading={list.isRefetching} onClick={() => void list.refetch()}>
            {t('common.retry')}
          </Button>
        }
      />
    )
  if (players.length === 0) {
    if (query) return <EmptyState icon={MagnifyingGlassIcon} title={t('social.noPlayer')} description={t('social.noPlayerText')} />
    return (
      <EmptyState
        icon={UsersThreeIcon}
        title={t(tab === 'following' ? 'social.followingEmptyTitle' : 'social.followersEmptyTitle')}
        description={t(tab === 'following' ? 'social.followingEmptyText' : 'social.followersEmptyText')}
      />
    )
  }
  return (
    <div className="px-4 pt-1 pb-8">
      <div className="overflow-hidden rounded-jo-lg bg-jo-surface">
        {players.map((player, index) => (
          <ContactRow key={player.userId} player={player} onChallenge={onChallenge} last={index === players.length - 1} />
        ))}
      </div>
      <FeedFooter className="pt-4" {...feedFooterProps(list)} endLabel={t('social.end')} />
    </div>
  )
}

/**
 * Lien de notification Web Push du BFF (`docs/api/compte.md` : `/social?tab=challenges&type=received&room={roomId}`,
 * routes du mobile) : sur le web, les défis ont leur onglet propre, le lien y mène.
 */
export function SocialPage() {
  const [params] = useSearchParams()
  if (params.get('tab') === 'challenges') {
    const type = params.get('type') as ChallengesTab | null
    return <Navigate to={ROUTES.challengesTab(type && CHALLENGES_TABS.includes(type) ? type : 'received')} replace />
  }
  return <SocialContent />
}

/**
 * Social (`design/specs/screens/social.md`, lab `/screens/social?view=compact`) : abonnements et abonnés, recherche,
 * tri (feuille « Trier par ») et défi par l'épée de chaque ligne. La ligne ouvre la fiche ; on suit depuis la fiche.
 * La recherche et le tri valent pour les deux onglets ; le serveur pagine par 20.
 */
function SocialContent() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const me = useMe().data
  const [tab, setTab] = useTabParam<Tab>(['following', 'followers'], 'following')
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim(), 250)
  const [sort, setSort] = useState<PeopleSort>(DEFAULT_SORT)
  const [sortOpen, setSortOpen] = useState(false)
  const [challenged, setChallenged] = useState<PlayerCardView | null>(null)
  const [challengeOpen, setChallengeOpen] = useState(false)
  const [challengeKey, setChallengeKey] = useState(0)
  const challenge = useChallengePlayer()

  const openChallenge = (player: PlayerCardView) => {
    setChallenged(player)
    setChallengeKey((key) => key + 1)
    setChallengeOpen(true)
  }
  const pages = (['following', 'followers'] as const).map((value) => ({
    value,
    content: <Players tab={value} query={search} sort={sort} onChallenge={openChallenge} />,
  }))

  return (
    <Screen
      header={
        <>
          <MobileTopBar title={t('nav.social')} right={
              <>
                <NotificationBell />
                <SettingsButton from="social" />
              </>
            } />
          <div className="grid gap-3 px-4 pt-1 pb-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <SearchField value={query} onChange={setQuery} placeholder={t('social.search')} label={t('social.search')} />
              <IconButton
                icon={SlidersHorizontalIcon}
                label={t('social.sortLabel')}
                variant="gray"
                tone="neutral"
                badge={sort === DEFAULT_SORT ? undefined : 'dot'}
                onClick={() => setSortOpen(true)}
              />
            </div>
            <JoutioTabs
              label={t('social.tabs')}
              value={tab}
              onChange={setTab}
              options={[
                { value: 'following', label: t('social.following', { count: me?.followingCount ?? 0 }) },
                { value: 'followers', label: t('social.followers', { count: me?.followersCount ?? 0 }) },
              ]}
            />
          </div>
        </>
      }
      bottomNav={<TabNav active="social" />}
      overlay={
        <>
          <MobileSheet open={sortOpen} onClose={() => setSortOpen(false)} title={t('social.sortBy')}>
            <RadioGroup label={t('social.sortBy')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
              {SORTS.map((option, index) => (
                <ListRow
                  key={option.value}
                  label={t(option.label)}
                  control="radio"
                  on={sort === option.value}
                  onToggle={() => {
                    setSort(option.value)
                    setSortOpen(false)
                  }}
                  last={index === SORTS.length - 1}
                />
              ))}
            </RadioGroup>
          </MobileSheet>
          <ChallengeTopicSheet
            key={challengeKey}
            player={challenged?.pseudonym ?? ''}
            open={challengeOpen}
            onClose={() => setChallengeOpen(false)}
            onPick={(topic) => {
              if (!challenged) return
              challenge.start({
                topic: { topicId: topic.topicId, name: topicName(topic.names, language), category: topic.category },
                opponent: { userId: challenged.userId, pseudonym: challenged.pseudonym },
              })
            }}
          />
        </>
      }
    >
      <TabsScrollView fill value={tab} onChange={setTab} pages={pages} />
    </Screen>
  )
}
