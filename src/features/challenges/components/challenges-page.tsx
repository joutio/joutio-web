import type { ChallengeView } from '@joutio/client/api-types'
import { remindDelay, type RoomView } from '@joutio/client/rooms'
import { useQueryClient } from '@tanstack/react-query'
import { DoorOpenIcon, LightningIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
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
import { CHALLENGES_TABS, ROUTES, type ChallengesTab } from '@/shared/routes'
import { useTabParam } from '@/shared/use-tab-param'
import { topicName } from '@/shared/topics'
import { Button, ChallengeListRow, EmptyState, FeedFooter, JoutioTabs, ListRow, MobileTopBar, Screen, SectionHeader, Skeleton } from '@/ui'
import { refreshChallenges, useAcceptChallenge, useCancelChallenges, useDeclineChallenges, useMyChallenges, useMyRooms, useRemindChallenge } from '../hooks/use-challenges'
import { openRooms, RECEIVED_PAGE, splitChallenges } from '../lib/challenges-service'

const TAB_LABELS: Record<ChallengesTab, MessageKey> = {
  received: 'challenges.received',
  sent: 'challenges.sent',
  rooms: 'challenges.rooms',
}

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
  remind: ReturnType<typeof useRemindChallenge>
}

/** Re-rend la ligne toutes les 15 s tant que `active` : le décompte de la relance avance sans relire le serveur. */
function useTicking(active: boolean) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 15_000)
    return () => window.clearInterval(timer)
  }, [active])
}

/** Un défi : le joueur, le sujet et le délai, puis deux actions (Refuser / Accepter, Annuler / Relancer). */
function ChallengeRow({ challenge, kind, last, accept, decline, cancel, remind }: RowProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const duration = useDuration()
  const player = kind === 'received' ? challenge.challenger : challenge.opponent
  const src = useUserAvatar(player)
  const identity = usePlayerIdentity()
  const now = readServerNow()
  const remindIn = kind === 'sent' ? remindDelay(challenge, now) : 0
  useTicking(remindIn > 0)
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
      // Relance au plus toutes les 10 min (`defis.md` § 5) : le décompte s'affiche dans le bouton.
      primary={{
        label: remindIn > 0 ? t('challenges.remindIn', { duration: duration(remindIn) }) : t('challenges.remind'),
        loading: remind.isPending && remind.variables === id,
        disabled: remindIn > 0 || remind.isPending,
        onClick: () => remind.mutate(id),
      }}
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
 * Défis (`design/specs/screens/defis.md`, lab `/screens/defis?view=compact`) : barre « Défis » (cloche, Réglages), puis
 * onglets Reçus / Envoyés / Salons comme l'Accueil (2026-11-14), leur nombre dans le libellé. Reçus (par défaut) :
 * liste paginée et « Tout refuser » confirmé. L'onglet est dans l'URL (`?tab=sent`) : les notifications y mènent.
 * Rafraîchi par le flux personnel.
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
  const remind = useRemindChallenge()
  const createRoom = useCreatePrivateRoom()
  const [tab, setTab] = useTabParam(CHALLENGES_TABS, 'received')
  const [receivedPages, setReceivedPages] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerKey, setPickerKey] = useState(0)

  const { received, sent } = splitChallenges(challenges.data, userId)
  const salons = openRooms(rooms.data)
  const loading = challenges.isPending || rooms.isPending
  const failed = challenges.isError || rooms.isError
  const empty = !loading && !failed && received.length + sent.length + salons.length === 0
  const receivedRows = received.slice(0, receivedPages * RECEIVED_PAGE)
  const counts: Record<ChallengesTab, number> = { received: received.length, sent: sent.length, rooms: salons.length }
  // Le nombre suit le libellé (« Reçus · 5 ») ; sans élément, le libellé seul.
  const tabs = CHALLENGES_TABS.map((value) => ({ value, label: counts[value] > 0 ? `${t(TAB_LABELS[value])} · ${counts[value]}` : t(TAB_LABELS[value]) }))
  const changeTab = (next: ChallengesTab) => {
    setTab(next)
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

  const rowProps = { accept, decline, cancel, remind }

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
            <div className="px-4 pt-1 pb-3">
              <JoutioTabs label={t('nav.challenges')} options={tabs} value={tab} onChange={changeTab} />
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
          {tab === 'received' && received.length === 0 && <EmptyState icon={LightningIcon} title={t('challenges.noReceived')} description={t('challenges.noReceivedText')} />}
          {tab === 'received' && received.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader
                title={t('challenges.received')}
                action={
                  <Button variant="plain" tone="destructive" size="S" disabled={decline.isPending} onClick={refuseAll}>
                    {t('challenges.refuseAll')}
                  </Button>
                }
              />
              <div className={CARD}>
                {receivedRows.map((challenge, index) => (
                  <ChallengeRow key={challenge.challengeId} challenge={challenge} kind="received" last={index === receivedRows.length - 1} {...rowProps} />
                ))}
              </div>
              <FeedFooter
                state={receivedRows.length < received.length ? 'more' : 'end'}
                pages={receivedPages}
                onLoadMore={() => setReceivedPages((pages) => pages + 1)}
                onRetry={() => setReceivedPages((pages) => pages + 1)}
                endLabel={t('challenges.receivedEnd')}
              />
            </section>
          )}
          {tab === 'sent' && sent.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader title={t('challenges.sent')} />
              <div className={CARD}>
                {sent.map((challenge, index) => (
                  <ChallengeRow key={challenge.challengeId} challenge={challenge} kind="sent" last={index === sent.length - 1} {...rowProps} />
                ))}
              </div>
            </section>
          )}
          {tab === 'sent' && sent.length === 0 && <EmptyState icon={LightningIcon} title={t('challenges.noSent')} description={t('challenges.noSentText')} />}
          {tab === 'rooms' && salons.length > 0 && (
            <section className="grid gap-3">
              <SectionHeader title={t('challenges.privateRooms')} />
              <div className={CARD}>
                {salons.map((room, index) => (
                  <RoomRow key={room.roomId} room={room} last={index === salons.length - 1} />
                ))}
              </div>
            </section>
          )}
          {tab === 'rooms' && salons.length === 0 && (
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
