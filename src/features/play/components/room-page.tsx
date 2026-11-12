import { preparationComplete, preparationStep, wizzState, type RoomStatus } from '@joutio/client-domain/rooms'
import { LightningIcon, LinkIcon, RobotIcon, SwordIcon, WarningCircleIcon } from '@phosphor-icons/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMe, usePlayerIdentity } from '@/features/me'
import { useT, useLanguageStore, type MessageKey } from '@/lib/i18n'
import { useServerClock, useServerNow } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { useOngoingStore } from '@/shared/ongoing-store'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toast } from '@/shared/toast'
import { topicName } from '@/shared/topics'
import { Button, EmptyState, MobileTopBar, Pill, PreparationSteps, RoomPlayers, Screen, type RoomPlayer } from '@/ui'
import { useCloseRoom, usePlayerProfile, useRoom, useRoomPresence, useWizzRoom, type PlayTopic } from '../hooks/use-play'

const TERMINAL: Partial<Record<RoomStatus, { title: MessageKey; text: MessageKey }>> = {
  CANCELLED: { title: 'room.cancelledTitle', text: 'room.cancelledText' },
  EXPIRED: { title: 'room.expiredTitle', text: 'room.expiredText' },
  FAILED: { title: 'room.failedTitle', text: 'room.failedText' },
}

const STEPS: readonly { id: string; label: MessageKey }[] = [
  { id: 'players', label: 'room.stepPlayers' },
  { id: 'profiles', label: 'room.stepProfiles' },
  { id: 'questions', label: 'room.stepQuestions' },
  { id: 'launch', label: 'room.stepLaunch' },
]

function countdownOf(expiresAt: string | null, now: number) {
  if (!expiresAt) return null
  const left = Math.max(0, Math.round((Date.parse(expiresAt) - now) / 1000))
  // Au-delà d'une heure (salon de 24 h) : heures et minutes ; dans la dernière heure : minutes et secondes.
  if (left >= 3600) return `${Math.floor(left / 3600)} h ${String(Math.floor((left % 3600) / 60)).padStart(2, '0')}`
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`
}

function Page({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  const t = useT()
  return <Screen header={<MobileTopBar variant="inline" title={t('room.title')} back={t('topic.back')} onBack={onBack} />}>{children}</Screen>
}

/**
 * Salon de préparation (`defis.md` § 2, lab `defis.tsx` `RoomBody`) : un seul écran pour toute salle — partagée, défi
 * nominatif, bot ou issue d'un appariement. Présence de chacun, étapes de préparation, décompte ; « Copier le lien »
 * pour un salon partagé (`web.md`) ; relance de l'adversaire nommé absent ; annulation par l'initiateur. Le retour
 * pendant l'attente quitte le salon sans le fermer. La partie créée ouvre l'arène.
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
  const { view, room, status } = useRoom(roomId)
  // Suivi au-delà de l'écran : la partie créée après l'avoir quitté apparaît dans le bandeau « Partie en cours ».
  const trackRoom = useOngoingStore((state) => state.trackRoom)
  useEffect(() => trackRoom(roomId), [roomId, trackRoom])
  const presence = useRoomPresence(roomId)
  const wizz = useWizzRoom(roomId)
  const closing = useCloseRoom()

  const topic = view.data ? topicName(view.data.topic.names, language) : (passed?.name ?? '')
  const gameId = room?.gameId ?? view.data?.gameId ?? null
  const roomStatus: RoomStatus = room?.status ?? view.data?.status ?? 'WAITING_PLAYERS'
  const vsBot = room?.vsBot ?? view.data?.vsBot ?? false
  const isInitiator = room?.initiatorId ? room.initiatorId === userId : (view.data?.canCancel ?? false)
  // Salle nominative : l'adversaire est connu dès la création (défi, appariement) ; partagée : il arrive par le lien.
  const nominative = Boolean(room?.opponentId)
  const shared = !vsBot && !nominative
  const waiting = roomStatus === 'WAITING_PLAYERS'
  const terminal = TERMINAL[roomStatus]
  const engaged = !waiting && !terminal

  const opponentId = vsBot ? null : isInitiator ? (room?.opponentId ?? room?.participantId ?? null) : (room?.initiatorId ?? null)
  const opponentView = view.data?.opponent ?? null
  const fetched = usePlayerProfile(opponentId ?? '', Boolean(opponentId) && !opponentView)
  const opponentProfile = opponentView ?? fetched.data ?? null
  const opponentAvatar = useUserAvatar(opponentProfile)
  const opponentName = vsBot ? t('topic.bot') : opponentProfile?.pseudonym
  const myPresent = room ? (isInitiator ? room.initiatorPresent : room.participantPresent) : false
  const opponentPresent = vsBot ? true : room ? (isInitiator ? room.participantPresent : room.initiatorPresent) : false
  const countdown = waiting ? countdownOf(room?.expiresAt ?? view.data?.expiresAt ?? null, now) : null

  const serverWizz = room ? wizzState(room, userId || null, now) : { available: false, cooldownEndsAt: null }
  const localCooldown = wizz.sentAt === null ? 0 : wizz.sentAt + 10_000
  const wizzAvailable = serverWizz.available && localCooldown <= now
  const cooldownEndsAt = Math.max(serverWizz.cooldownEndsAt ?? 0, localCooldown) || null
  const wizzSeconds = cooldownEndsAt ? Math.max(0, Math.ceil((cooldownEndsAt - now) / 1000)) : 0
  const wizzVisible = nominative && waiting && (wizzAvailable || wizz.isPending || wizzSeconds > 0)

  // La partie est créée : l'arène remplace le salon (le retour ramène à l'écran d'avant).
  const done = useRef(false)
  useEffect(() => {
    if (!gameId || done.current) return
    done.current = true
    void navigate(ROUTES.game(gameId), { replace: true, state: { topic: passed ?? (view.data ? { topicId: view.data.topic.topicId, name: topic, category: view.data.topic.category } : undefined) } })
  }, [gameId, navigate, passed, topic, view.data])

  // Quitter l'écran, fermer l'onglet ou perdre la connexion : le serveur le constate (canal de présence).

  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.challenges, { replace: true }))
  const cancel = () =>
    closing.mutate(roomId, {
      onSuccess: () => back(),
    })
  const copyLink = () => {
    void navigator.clipboard
      ?.writeText(`${window.location.origin}${ROUTES.join(roomId)}`)
      .then(() => toast.success(t('topic.linkCopied')))
      .catch(() => toast.error(t('topic.linkError')))
  }

  if (terminal || status?.terminalError) {
    const copy = terminal ?? { title: 'room.notFoundTitle' as const, text: 'room.notFoundText' as const }
    return (
      <Page onBack={back}>
        <EmptyState className="pt-24" icon={WarningCircleIcon} title={t(copy.title)} description={t(copy.text)} action={<Button onClick={back}>{t('topic.back')}</Button>} />
      </Page>
    )
  }

  const myTier = me.data?.progression && !me.data.progression.provisional ? tierOf(me.data.progression.rating) : undefined
  const meSeat: RoomPlayer = { name: me.data?.pseudonym ?? '', src: myAvatar, tier: myTier, premium: identity.myPremium, away: !myPresent, status: t(myPresent ? 'room.inRoom' : 'room.connecting') }
  const opponentRating = opponentView?.rating ?? fetched.data?.progression?.rating ?? null
  const opponentProvisional = opponentView?.provisional ?? fetched.data?.progression?.provisional ?? true
  const opponentSeat: RoomPlayer | undefined = vsBot
    ? { name: t('topic.bot'), status: t('room.ready') }
    : opponentId
      ? {
          name: opponentName ?? t('topic.opponent'),
          premium: identity.premium(opponentProfile, opponentId),
          src: opponentAvatar,
          tier: opponentRating != null && !opponentProvisional ? tierOf(opponentRating) : undefined,
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
    <Page onBack={back}>
      <div className="flex min-h-full flex-col gap-6 px-4 pt-2 pb-6">
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
        {shared && waiting && (
          <Button full variant="tinted" icon={LinkIcon} onClick={copyLink}>
            {t('topic.copyLink')}
          </Button>
        )}
        <div className="mt-auto grid gap-3">
          {presence.failed && (
            <div className="grid gap-2">
              <p className="jo-type-caption m-0 text-center text-jo-muted">{presence.problem?.detail ?? t('room.presenceError')}</p>
              <Button full variant="gray" tone="neutral" onClick={presence.retry}>
                {t('common.retry')}
              </Button>
            </div>
          )}
          {wizzVisible && (
            <Button full icon={LightningIcon} loading={wizz.isPending} disabled={!wizzAvailable} onClick={() => wizz.mutate()}>
              {wizzSeconds > 0 ? t('room.wizzIn', { seconds: wizzSeconds }) : t('room.wizz', { name: opponentName ?? t('topic.opponent') })}
            </Button>
          )}
          {isInitiator && (
            <Button full variant="tinted" tone="destructive" loading={closing.isPending} onClick={cancel}>
              {cancelLabel}
            </Button>
          )}
        </div>
      </div>
    </Page>
  )
}
