import { useMe } from '@joutio/client/me'
import { useProfile } from '@joutio/client/profile'
import { preparationComplete, preparationStep, Room, useCancelRooms, useRemindRoom, useRoom, useRoomStream, type JoinRefusal, type RoomFailureKind, type RoomStatus } from '@joutio/client/rooms'
import { LightningIcon, LinkIcon, RobotIcon, ShareNetworkIcon, SwordIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePlayerIdentity } from '@/features/me'
import { useShare } from '@/features/share'
import { useT, useLanguageStore, type MessageKey } from '@/lib/i18n'
import { useServerClock, useServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toast } from '@/shared/toast'
import { topicName } from '@/shared/topics'
import { Button, EmptyState, MobileTopBar, Pill, PreparationSteps, RoomPlayers, Screen, type RoomPlayer } from '@/ui'
import { useRoomPresence, type PlayTopic } from '../hooks/use-play'
import { countdownOf } from '../lib/countdown'

const TERMINAL: Partial<Record<RoomStatus, { title: MessageKey; text: MessageKey }>> = {
  CANCELLED: { title: 'room.cancelledTitle', text: 'room.cancelledText' },
  EXPIRED: { title: 'room.expiredTitle', text: 'room.expiredText' },
  DECLINED: { title: 'room.cancelledTitle', text: 'room.cancelledText' },
}

/** Refus d'entrée poussé par le serveur (`useJoinRefusal`) ; une salle disparue a son écran de fin. */
const REFUSAL_TEXT: Record<Exclude<JoinRefusal, 'GONE'>, MessageKey> = {
  FULL: 'join.unavailableText',
  NOT_INVITED: 'room.presenceError',
  UNAVAILABLE: 'room.presenceError',
}

/** Explication d'un échec selon le motif serveur (`ROOM_FAILED.reason`) ; repli générique. */
const FAILURE_TEXT: Record<RoomFailureKind, MessageKey> = {
  language: 'room.failedLanguageText',
  topic: 'room.failedTopicText',
  timeout: 'room.failedTimeoutText',
  unknown: 'room.failedText',
}

const STEPS: readonly { id: string; label: MessageKey }[] = [
  { id: 'players', label: 'room.stepPlayers' },
  { id: 'profiles', label: 'room.stepProfiles' },
  { id: 'questions', label: 'room.stepQuestions' },
  { id: 'launch', label: 'room.stepLaunch' },
]

function Page({ onBack, bottomBar, children }: { onBack: () => void; bottomBar?: ReactNode; children: ReactNode }) {
  const t = useT()
  return (
    <Screen header={<MobileTopBar variant="inline" title={t('room.title')} back={t('topic.back')} onBack={onBack} />} bottomBar={bottomBar}>
      {children}
    </Screen>
  )
}

/**
 * Salon de préparation (`defis.md` § 2, lab `defis.tsx` `RoomBody`) : un seul écran pour toute salle — partagée, défi
 * nominatif, bot ou issue d'un appariement. Présence de chacun, étapes de préparation, décompte ; « Copier le lien »
 * pour un salon partagé (`web.md`) ; relance de l'adversaire nommé absent ; annulation par l'initiateur. Le retour
 * pendant l'attente quitte le salon sans le fermer. Actions fixées en bas, hors du défilement (comme joutio-mobile). La
 * partie créée ouvre l'arène.
 */
export function RoomPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const location = useLocation()
  const { roomId = '' } = useParams()
  const passed = (location.state as { topic?: PlayTopic } | null)?.topic
  useServerClock()
  const now = useServerNow()
  const me = useMe()
  const identity = usePlayerIdentity()
  const userId = me.data?.userId ?? ''
  const myAvatar = useUserAvatar(me.data)
  const view = useRoom(roomId || undefined)
  const { state: room, status } = useRoomStream(roomId || undefined)
  const presence = useRoomPresence(roomId)
  const remind = useRemindRoom()
  const closing = useCancelRooms()

  const topic = view.data ? topicName(view.data.topic.names, language) : (passed?.name ?? '')
  const gameId = room?.gameId ?? view.data?.gameId ?? null
  const roomStatus: RoomStatus = room?.status ?? view.data?.status ?? 'WAITING_PLAYERS'
  const vsBot = room?.vsBot ?? view.data?.vsBot ?? false
  const isInitiator = room?.initiatorId ? room.initiatorId === userId : (view.data?.canCancel ?? false)
  // Salle nominative : l'adversaire est connu dès la création (défi, appariement) ; partagée : il arrive par le lien.
  const nominative = Boolean(room?.opponentId)
  const shared = !vsBot && !nominative
  // Défi pas encore accepté (`INVITED`) : l'attente commence déjà.
  const waiting = roomStatus === 'WAITING_PLAYERS' || roomStatus === 'INVITED'
  const terminal =
    roomStatus === 'FAILED'
      ? { title: 'room.failedTitle' as const, text: FAILURE_TEXT[Room.failureKind(room?.failureReason)] }
      : TERMINAL[roomStatus]
  const engaged = !waiting && !terminal

  const opponentId = vsBot ? null : isInitiator ? (room?.opponentId ?? room?.participantId ?? null) : (room?.initiatorId ?? null)
  const opponentView = view.data?.opponent ?? null
  const fetched = useProfile(opponentId && !opponentView ? opponentId : undefined)
  const opponentProfile = opponentView ?? fetched.data ?? null
  const opponentAvatar = useUserAvatar(opponentProfile)
  const opponentName = vsBot ? t('topic.bot') : opponentProfile?.pseudonym
  const myPresent = room ? (isInitiator ? room.initiatorPresent : room.participantPresent) : false
  const opponentPresent = vsBot ? true : room ? (isInitiator ? room.participantPresent : room.initiatorPresent) : false
  const countdown = waiting ? countdownOf(room?.expiresAt ?? view.data?.expiresAt ?? null, now) : null

  // Relance de l'adversaire absent : disponibilité et cadence lues sur le flux de la salle (`ROOM_REMINDED`).
  const reminder = room ? room.reminderState(userId || null, now) : { available: false, cooldownEndsAt: null }
  const wizzSeconds = reminder.cooldownEndsAt ? Math.max(0, Math.ceil((reminder.cooldownEndsAt - now) / 1000)) : 0
  const wizzVisible = nominative && waiting && (reminder.available || remind.isPending || wizzSeconds > 0)
  const wizz = () => remind.mutate(roomId, { onError: () => toast.error(t('play.wizzError')) })

  // La partie est créée : l'arène remplace le salon (le retour ramène à l'écran d'avant).
  const done = useRef(false)
  useEffect(() => {
    if (!gameId || done.current) return
    done.current = true
    void navigate(ROUTES.game(gameId), { replace: true, state: { topic: passed ?? (view.data ? { topicId: view.data.topic.topicId, name: topic, category: view.data.topic.category } : undefined) } })
  }, [gameId, navigate, passed, topic, view.data])

  // Quitter l'écran, fermer l'onglet ou perdre la connexion : le serveur le constate (canal de présence).

  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.challenges, { replace: true }))
  // L'initiateur ferme le salon : l'écran se quitte dès l'appel, un refus s'annonce en toast.
  const cancel = () => {
    closing.mutate([roomId], { onError: () => toast.error(t('play.closeError'), t('home.errorText')) })
    back()
  }
  const share = useShare()
  const shareRoom = () => share({ kind: 'room', id: roomId, title: t('share.roomTitle'), text: t('share.roomText') })

  if (terminal || status?.notFound || presence.refusal === 'GONE') {
    const copy = terminal ?? { title: 'room.notFoundTitle' as const, text: 'room.notFoundText' as const }
    return (
      <Page onBack={back}>
        <EmptyState className="pt-24" icon={WarningCircleIcon} title={t(copy.title)} description={t(copy.text)} action={<Button onClick={back}>{t('topic.back')}</Button>} />
      </Page>
    )
  }

  const myTier = me.data?.progression ? tierOf(me.data.progression.rating) : undefined
  const meSeat: RoomPlayer = { name: me.data?.pseudonym ?? '', src: myAvatar, tier: myTier, premium: identity.myPremium, away: !myPresent, status: t(myPresent ? 'room.inRoom' : 'room.connecting') }
  const opponentRating = opponentView?.rating ?? fetched.data?.progression?.rating ?? null
  const opponentSeat: RoomPlayer | undefined = vsBot
    ? { name: t('topic.bot'), status: t('room.ready') }
    : opponentId
      ? {
          name: opponentName ?? t('topic.opponent'),
          premium: identity.premium(opponentProfile, opponentId),
          src: opponentAvatar,
          tier: opponentRating != null ? tierOf(opponentRating) : undefined,
          away: !opponentPresent,
        }
      : undefined
  const detail = waiting
    ? myPresent && opponentPresent && opponentSeat
      ? t('room.bothHere')
      : opponentName && !vsBot
        ? t('room.waitingFor', { name: opponentName })
        : t('room.waitingOpponent')
    : undefined
  const kind = vsBot ? { icon: RobotIcon, label: t('room.training') } : nominative ? { icon: SwordIcon, label: t('room.challenge') } : { icon: LinkIcon, label: t('room.private') }
  const cancelLabel = t(vsBot ? 'room.cancelDuel' : nominative ? 'room.cancelChallenge' : 'room.closeRoom')

  return (
    <Page
      onBack={back}
      bottomBar={
        <div className="grid gap-2 p-4">
          {presence.refusal && (
            <div className="grid gap-2">
              <p className="jo-type-caption m-0 text-center text-jo-muted">{t(REFUSAL_TEXT[presence.refusal])}</p>
              <Button full variant="gray" tone="neutral" onClick={presence.retry}>
                {t('common.retry')}
              </Button>
            </div>
          )}
          {wizzVisible && (
            <Button full icon={LightningIcon} loading={remind.isPending} disabled={!reminder.available} onClick={wizz}>
              {wizzSeconds > 0 ? t('room.wizzIn', { seconds: wizzSeconds }) : t('room.wizz', { name: opponentName ?? t('topic.opponent') })}
            </Button>
          )}
          {shared && waiting && (
            <Button full icon={ShareNetworkIcon} onClick={shareRoom}>
              {t('share.roomButton')}
            </Button>
          )}
          {isInitiator && (
            <Button full variant="tinted" tone="destructive" loading={closing.isPending} onClick={cancel}>
              {cancelLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 px-4 pt-2 pb-6">
        <div className="grid justify-items-center gap-2 text-center">
          <Pill icon={kind.icon}>{kind.label}</Pill>
          <h1 className="jo-type-title-1">{topic}</h1>
          {countdown && (
            <span className="jo-type-callout text-jo-muted">
              {t('room.expiresIn')} <span className="font-mono">{countdown}</span>
            </span>
          )}
        </div>
        <RoomPlayers me={meSeat} opponent={opponentSeat} />
        <PreparationSteps
          steps={STEPS.map((step) => ({ id: step.id, label: t(step.label) }))}
          current={preparationStep(roomStatus)}
          detail={detail}
          engaged={engaged}
          complete={preparationComplete(roomStatus)}
        />
      </div>
    </Page>
  )
}
