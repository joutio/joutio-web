import type { ChallengeView } from '@joutio/client-domain/api-types'
import type { RoomView } from '@joutio/client-domain/rooms'
import { useQueryClient } from '@tanstack/react-query'
import { DoorOpenIcon, LightningIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMe, usePlayerIdentity } from '@/features/me'
import { NotificationBell } from '@/features/notifications'
import { SettingsButton } from '@/features/settings'
import { useCreatePrivateRoom } from '@/features/play'
import { ChallengeTopicSheet } from '@/features/player'
import { TabNav } from '@/features/shell'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { readServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { showDialog } from '@/shared/dialog'
import { useDuration } from '@/shared/duration'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { Button, ChallengeListRow, Chip, EmptyState, FeedFooter, ListRow, MobileTopBar, Screen, SectionHeader, Skeleton } from '@/ui'
import { refreshChallenges, useAcceptChallenge, useCancelChallenges, useDeclineChallenges, useMyChallenges, useMyRooms } from '../hooks/use-challenges'
import { openRooms, RECEIVED_PAGE, RECEIVED_PREVIEW, splitChallenges } from '../lib/challenges-service'

type Filter = 'all' | 'received' | 'sent' | 'rooms'

const FILTERS: readonly { value: Filter; label: MessageKey }[] = [
  { value: 'all', label: 'challenges.all' },
  { value: 'received', label: 'challenges.received' },
  { value: 'sent', label: 'challenges.sent' },
  { value: 'rooms', label: 'challenges.rooms' },
]

const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

function Loading() {
  const t = useT()
  return (
    <div className="grid gap-2 px-4 pt-1 pb-6" aria-label={t('common.loading')}>
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} shape="card" className="h-28" />
      ))}
    </div>
  )
}

type RowProps = {
  challenge: ChallengeView
  kind: 'received' | 'sent'
  last: boolean
  accept: ReturnType<typeof useAcceptChallenge>
  decline: ReturnType<typeof useDeclineChallenges>
  cancel: ReturnType<typeof useCancelChallenges>
}

/** Un défi : le joueur, le sujet et le délai, puis deux actions (Refuser / Accepter, Annuler / Relancer). */
function ChallengeRow({ challenge, kind, last, accept, decline, cancel }: RowProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const duration = useDuration()
  const player = kind === 'received' ? challenge.challenger : challenge.opponent
  const src = useUserAvatar(player)
  const identity = usePlayerIdentity()
  const now = readServerNow()
  const status =
    kind === 'received'
      ? t('challenges.expiresIn', { duration: duration(Date.parse(challenge.expiresAt) - now) })
      : t('challenges.waiting', { duration: duration(now - Date.parse(challenge.createdAt)) })
  const sub = `${topicName(challenge.topic.names, language)} · ${status}`
  const id = challenge.challengeId
  if (kind === 'received')
    return (
      <ChallengeListRow
        name={player.pseudonym}
        premium={identity.premium(player)}
        src={src}
        sub={sub}
        onClick={identity.open(player.userId)}
        last={last}
        primary={{ label: t('challenges.accept'), loading: accept.isPending && accept.variables?.challengeId === id, disabled: accept.isPending, onClick: () => accept.mutate(challenge) }}
        secondary={{ label: t('challenges.decline'), loading: decline.isPending && Boolean(decline.variables?.includes(id)), disabled: decline.isPending, onClick: () => decline.mutate([id]) }}
      />
    )
  return (
    <ChallengeListRow
      name={player.pseudonym}
      premium={identity.premium(player)}
      src={src}
      sub={sub}
      onClick={identity.open(player.userId)}
      last={last}
      primaryVariant="tinted"
      // Relancer un défi n'existe pas côté BFF (`defis.md` § 5) : visible, inactif, comme le mobile.
      primary={{ label: t('challenges.remind'), disabled: true }}
      secondary={{ label: t('challenges.cancel'), loading: cancel.isPending && Boolean(cancel.variables?.includes(id)), disabled: cancel.isPending, onClick: () => cancel.mutate([id]) }}
    />
  )
}

/** Un salon ouvert : ouvre le salon. */
function RoomRow({ room, last }: { room: RoomView; last: boolean }) {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const duration = useDuration()
  const name = topicName(room.topic.names, language)
  const who = room.opponent ? t('challenges.roomWith', { name: room.opponent.pseudonym }) : t('challenges.roomWaiting')
  const sub = room.expiresAt ? `${who} · ${t('challenges.expiresIn', { duration: duration(Date.parse(room.expiresAt) - readServerNow()) })}` : who
  return (
    <ListRow
      icon={DoorOpenIcon}
      label={name}
      sub={sub}
      control="chevron"
      onClick={() => void navigate(ROUTES.room(room.roomId), { state: { topic: { topicId: room.topic.topicId, name, category: room.topic.category } } })}
      last={last}
    />
  )
}

/**
 * Défis (`design/specs/screens/defis.md`, lab `/screens/defis?view=compact`) : barre « Défis » (quota des envoyés en
 * sous-titre, cloche), puces Tous / Reçus / Envoyés / Salons, puis Reçus (aperçu de 3 et « Tout voir » ; sous la puce
 * Reçus, liste paginée et « Tout refuser » confirmé), Envoyés et Salons privés. Rafraîchi par le flux personnel.
 */
export function ChallengesPage() {
  const t = useT()
  const navigate = useNavigate()
  const client = useQueryClient()
  const language = useLanguageStore((state) => state.language)
  const me = useMe()
  const userId = me.data?.userId ?? ''
  const challenges = useMyChallenges(Boolean(userId))
  const rooms = useMyRooms(Boolean(userId))
  const accept = useAcceptChallenge()
  const decline = useDeclineChallenges()
  const cancel = useCancelChallenges()
  const createRoom = useCreatePrivateRoom()
  const [filter, setFilter] = useState<Filter>('all')
  const [receivedPages, setReceivedPages] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerKey, setPickerKey] = useState(0)

  const { received, sent } = splitChallenges(challenges.data, userId)
  const salons = openRooms(rooms.data)
  const loading = challenges.isPending || rooms.isPending
  const failed = (challenges.isError && !challenges.data) || (rooms.isError && !rooms.data)
  const empty = !loading && !failed && received.length + sent.length + salons.length === 0
  const shows = (section: Filter) => filter === 'all' || filter === section
  const receivedRows = filter === 'all' ? received.slice(0, RECEIVED_PREVIEW) : received.slice(0, receivedPages * RECEIVED_PAGE)
  const counts: Record<Filter, number | undefined> = { all: undefined, received: received.length, sent: sent.length, rooms: salons.length }
  const changeFilter = (next: Filter) => {
    setFilter(next)
    setReceivedPages(1)
  }
  const openPicker = () => {
    setPickerKey((key) => key + 1)
    setPickerOpen(true)
  }

  const refuseAll = () =>
    showDialog({
      title: t('challenges.refuseAllTitle', { count: received.length }),
      message: t('challenges.refuseAllText'),
      icon: LightningIcon,
      tone: 'danger',
      actions: [
        { label: t('challenges.refuseAll'), variant: 'filled', tone: 'destructive', onClick: () => decline.mutate(received.map((challenge) => challenge.challengeId)) },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  const rowProps = { accept, decline, cancel }

  return (
    <Screen
      header={
        <>
          <MobileTopBar title={t('nav.challenges')} right={
              <>
                <NotificationBell />
                <SettingsButton from="challenges" />
              </>
            }
          />
          {!empty && !failed && !loading && (
            <div className="jo-no-scrollbar flex gap-2 overflow-x-auto px-4 pt-1 pb-3">
              {FILTERS.map((option) => (
                <Chip key={option.value} selected={filter === option.value} count={counts[option.value]} className="flex-none" onClick={() => changeFilter(option.value)}>
                  {t(option.label)}
                </Chip>
              ))}
            </div>
          )}
        </>
      }
      bottomNav={<TabNav active="challenges" />}
      overlay={
        <ChallengeTopicSheet
          key={pickerKey}
          player=""
          title={t('challenges.createRoom')}
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onPick={(topic) => createRoom.mutate({ topicId: topic.topicId, name: topicName(topic.names, language), category: topic.category ?? undefined })}
        />
      }
    >
      {loading && <Loading />}
      {failed && (
        <EmptyState
          className="pt-16"
          icon={WarningCircleIcon}
          title={t('challenges.errorTitle')}
          description={t('home.errorText')}
          action={
            <Button loading={challenges.isFetching || rooms.isFetching} onClick={() => refreshChallenges(client)}>
              {t('common.retry')}
            </Button>
          }
        />
      )}
      {empty && (
        <EmptyState
          className="pt-16"
          icon={LightningIcon}
          title={t('challenges.emptyTitle')}
          description={t('challenges.emptyText')}
          action={
            <div className="grid gap-2">
              <Button full loading={createRoom.isPending} onClick={openPicker}>
                {t('challenges.createRoom')}
              </Button>
              <Button full variant="tinted" onClick={() => void navigate(ROUTES.social)}>
                {t('challenges.challengeFollowed')}
              </Button>
            </div>
          }
        />
      )}
      {!loading && !failed && !empty && (
        <div className="grid gap-6 px-4 pt-1 pb-8">
          {filter === 'received' && received.length === 0 && <EmptyState icon={LightningIcon} title={t('challenges.noReceived')} description={t('challenges.noReceivedText')} />}
          {shows('received') && received.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader
                title={t('challenges.received')}
                action={
                  filter === 'all' ? (
                    received.length > RECEIVED_PREVIEW && (
                      <Button variant="plain" size="S" onClick={() => changeFilter('received')}>
                        {t('challenges.seeAll')}
                      </Button>
                    )
                  ) : (
                    <Button variant="plain" tone="destructive" size="S" disabled={decline.isPending} onClick={refuseAll}>
                      {t('challenges.refuseAll')}
                    </Button>
                  )
                }
              />
              <div className={CARD}>
                {receivedRows.map((challenge, index) => (
                  <ChallengeRow key={challenge.challengeId} challenge={challenge} kind="received" last={index === receivedRows.length - 1} {...rowProps} />
                ))}
              </div>
              {filter === 'received' && (
                <FeedFooter
                  state={receivedRows.length < received.length ? 'more' : 'end'}
                  pages={receivedPages}
                  onLoadMore={() => setReceivedPages((pages) => pages + 1)}
                  onRetry={() => setReceivedPages((pages) => pages + 1)}
                  endLabel={t('challenges.receivedEnd')}
                />
              )}
            </section>
          )}
          {shows('sent') && sent.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader title={t('challenges.sent')} />
              <div className={CARD}>
                {sent.map((challenge, index) => (
                  <ChallengeRow key={challenge.challengeId} challenge={challenge} kind="sent" last={index === sent.length - 1} {...rowProps} />
                ))}
              </div>
            </section>
          )}
          {filter === 'sent' && sent.length === 0 && <EmptyState icon={LightningIcon} title={t('challenges.noSent')} description={t('challenges.noSentText')} />}
          {shows('rooms') && salons.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader title={t('challenges.privateRooms')} />
              <div className={CARD}>
                {salons.map((room, index) => (
                  <RoomRow key={room.roomId} room={room} last={index === salons.length - 1} />
                ))}
              </div>
            </section>
          )}
          {filter === 'rooms' && salons.length === 0 && (
            <EmptyState
              icon={DoorOpenIcon}
              title={t('challenges.noRoom')}
              description={t('challenges.noRoomText')}
              action={
                <Button loading={createRoom.isPending} onClick={openPicker}>
                  {t('challenges.createRoom')}
                </Button>
              }
            />
          )}
        </div>
      )}
    </Screen>
  )
}
