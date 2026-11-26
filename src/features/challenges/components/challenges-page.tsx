import { invitationReminderDelay, useAcceptInvitation, useCancelRooms, useDeclineInvitations, useDefis, useRemindRoom, type RoomView } from '@joutio/client/rooms'
import { DoorOpenIcon, LightningIcon, SwordIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayerIdentity } from '@/features/me'
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
import { toast } from '@/shared/toast'
import { Button, ChallengeListRow, EmptyState, FeedFooter, JoutioTabs, ListRow, MobileTopBar, Screen, SectionHeader, Skeleton } from '@/ui'
import { selectUserId, useSessionStore } from '@/lib/session'

/** Défis reçus par page de l'onglet Reçus. */
const RECEIVED_PAGE = 10

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
  room: RoomView
  kind: 'received' | 'sent'
  last: boolean
  accept: (room: RoomView) => void
  accepting: string | null
  decline: ReturnType<typeof useDeclineInvitations>
  cancel: ReturnType<typeof useCancelRooms>
  remind: ReturnType<typeof useRemindRoom>
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

/** Un défi (salle `INVITED`) : le joueur, le sujet et le délai, puis deux actions (Refuser / Accepter, Annuler / Relancer). */
function ChallengeRow({ room, kind, last, accept, accepting, decline, cancel, remind }: RowProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const duration = useDuration()
  const player = room.opponent
  const src = useUserAvatar(player)
  const identity = usePlayerIdentity()
  const now = readServerNow()
  const remindIn = kind === 'sent' ? invitationReminderDelay(room, now) : 0
  useTicking(remindIn > 0)
  const status =
    kind === 'received'
      ? t('challenges.expiresIn', { duration: duration(Date.parse(room.expiresAt) - now) })
      : t('challenges.waiting', { duration: duration(now - Date.parse(room.createdAt)) })
  const sub = `${topicName(room.topic.names, language)} · ${status}`
  const id = room.roomId
  const name = player?.pseudonym ?? t('topic.opponent')
  if (kind === 'received')
    return (
      <ChallengeListRow
        name={name}
        premium={identity.premium(player)}
        src={src}
        sub={sub}
        onClick={identity.open(player?.userId)}
        last={last}
        primary={{ label: t('challenges.accept'), loading: accepting === id, disabled: accepting !== null, onClick: () => accept(room) }}
        secondary={{
          label: t('challenges.decline'),
          loading: decline.isPending && Boolean(decline.variables?.includes(id)),
          disabled: decline.isPending,
          onClick: () => decline.mutate([id], { onError: () => toast.error(t('challenges.declineError'), t('challenges.retryText')) }),
        }}
      />
    )
  return (
    <ChallengeListRow
      name={name}
      premium={identity.premium(player)}
      src={src}
      sub={sub}
      onClick={identity.open(player?.userId)}
      last={last}
      primaryVariant="tinted"
      // Relance au plus toutes les 10 min (`defis.md` § 5) : le décompte s'affiche dans le bouton.
      primary={{
        label: remindIn > 0 ? t('challenges.remindIn', { duration: duration(remindIn) }) : t('challenges.remind'),
        loading: remind.isPending && remind.variables === id,
        disabled: remindIn > 0 || remind.isPending,
        onClick: () =>
          remind.mutate(id, {
            onSuccess: () => toast.success(t('challenges.reminded')),
            onError: () => toast.error(t('challenges.remindError'), t('challenges.retryText')),
          }),
      }}
      secondary={{
        label: t('challenges.cancel'),
        loading: cancel.isPending && Boolean(cancel.variables?.includes(id)),
        disabled: cancel.isPending,
        onClick: () => cancel.mutate([id], { onError: () => toast.error(t('challenges.cancelError'), t('challenges.retryText')) }),
      }}
    />
  )
}

/** Une salle qui attend les joueurs : ouvre le salon. */
function RoomRow({ room, last }: { room: RoomView; last: boolean }) {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const duration = useDuration()
  const name = topicName(room.topic.names, language)
  const opponent = room.opponent ? t('challenges.roomWith', { name: room.opponent.pseudonym }) : t('challenges.roomWaiting')
  const who = room.origin === 'REMATCH' ? `${t('result.rematch')} · ${opponent}` : opponent
  const sub = room.expiresAt ? `${who} · ${t('challenges.expiresIn', { duration: duration(Date.parse(room.expiresAt) - readServerNow()) })}` : who
  return (
    <ListRow
      icon={room.origin === 'SHARED' ? DoorOpenIcon : SwordIcon}
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
 * Un défi est une salle `INVITED` : `useDefis` range les salles du joueur, poussées par la vue vivante `my-rooms`.
 */
export function ChallengesPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const defis = useDefis(useSessionStore(selectUserId) ?? undefined)
  const acceptInvitation = useAcceptInvitation()
  const decline = useDeclineInvitations()
  const cancel = useCancelRooms()
  const remind = useRemindRoom()
  const createRoom = useCreatePrivateRoom()
  const [tab, setTab] = useTabParam(CHALLENGES_TABS, 'received')
  const [receivedPages, setReceivedPages] = useState(1)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerKey, setPickerKey] = useState(0)

  const received = defis.data?.received ?? []
  const sent = defis.data?.sent ?? []
  const salons = defis.data?.waiting ?? []
  const loading = defis.isPending
  const failed = defis.isError
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
        {
          label: t('challenges.refuseAll'),
          variant: 'filled',
          tone: 'destructive',
          onClick: () =>
            decline.mutate(
              received.map((room) => room.roomId),
              { onError: () => toast.error(t('challenges.declineError'), t('challenges.retryText')) },
            ),
        },
        { label: t('common.cancel'), variant: 'plain', tone: 'neutral' },
      ],
    })

  // Accepter : la salle (même `roomId` que le défi) s'ouvre une fois l'acceptation validée.
  const accept = (room: RoomView) =>
    acceptInvitation.mutate(room.roomId, {
      onSuccess: () =>
        void navigate(ROUTES.room(room.roomId), { state: { topic: { topicId: room.topic.topicId, name: topicName(room.topic.names, language), category: room.topic.category } } }),
      onError: () => toast.error(t('challenges.acceptError')),
    })
  const accepting = acceptInvitation.isPending ? (acceptInvitation.variables ?? null) : null
  const rowProps = { accept, accepting, decline, cancel, remind }
  // Onglet Salons, selon l'origine (`defis.md` § 1) : défis acceptés (défi, revanche, appariement), puis salons privés.
  const roomSections = [
    ['challenges.acceptedChallenges', salons.filter((room) => room.origin !== 'SHARED')],
    ['challenges.privateRooms', salons.filter((room) => room.origin === 'SHARED')],
  ] as const

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
          onPick={(topic) => createRoom.start({ topicId: topic.topicId, name: topicName(topic.names, language), category: topic.category })}
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
            <Button loading={defis.isFetching} onClick={() => void defis.refetch()}>
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
                {receivedRows.map((room, index) => (
                  <ChallengeRow key={room.roomId} room={room} kind="received" last={index === receivedRows.length - 1} {...rowProps} />
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
                {sent.map((room, index) => (
                  <ChallengeRow key={room.roomId} room={room} kind="sent" last={index === sent.length - 1} {...rowProps} />
                ))}
              </div>
            </section>
          )}
          {tab === 'sent' && sent.length === 0 && <EmptyState icon={LightningIcon} title={t('challenges.noSent')} description={t('challenges.noSentText')} />}
          {tab === 'rooms' &&
            roomSections.map(
              ([title, list]) =>
                list.length > 0 && (
                  <section key={title} className="grid gap-3">
                    <SectionHeader title={t(title)} />
                    <div className={CARD}>
                      {list.map((room, index) => (
                        <RoomRow key={room.roomId} room={room} last={index === list.length - 1} />
                      ))}
                    </div>
                  </section>
                ),
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
