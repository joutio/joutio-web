import { CheckCircleIcon, RobotIcon } from '@phosphor-icons/react'
import { useCancelMatchmaking, useCancelRooms, useCreateBotRoom, useEnqueueMatchmaking, useMatchmakingStream, useRoom } from '@joutio/client/rooms'
import { useTopicOverview } from '@joutio/client/topics'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlayerIdentity } from '@/features/me'
import { useLanguageStore, useT } from '@/lib/i18n'
import { readServerNow, useServerClock } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { tierOf } from '@/shared/tier'
import { toast } from '@/shared/toast'
import { Avatar, Button, cn, EmptyState, MatchmakingMap, Notice, PlayerName, tokens, type MapPlayer } from '@/ui'
import { useAutoTrain, useBotDifficulty, useBotRoomError, useTicketPresence, type PlayTopic } from '../hooks/use-play'
import { DuelSheet } from './duel-sheet'

/** Épingles décoratives : le BFF n'expose pas la file d'attente (`matchmaking.md` § 5). */
const PINS: MapPlayer[] = [
  { name: 'Lucas', lon: -74, lat: 41, tier: 'OR', color: '#c0e8ff' },
  { name: 'Ines', lon: 2, lat: 47, tier: 'ARGENT', color: '#c0e8ff' },
  { name: 'Nora', lon: 31, lat: 30, tier: 'PLATINE', color: '#c0e8ff' },
  { name: 'Hugo', lon: -46, lat: -23, tier: 'BRONZE', color: '#c0e8ff' },
]
/** La salle n'expose pas de coordonnées : l'adversaire trouvé est posé sur l'Europe. */
const FOUND_AT = { lon: 2.35, lat: 46.6 }
/** Carte de l'adversaire trouvé avant la salle. */
const FOUND_MS = 1200

/** Panneau bas d'un état, sur toute la largeur. */
const PANEL = 'absolute inset-x-4 bottom-[calc(var(--jo-safe-bottom,0px)+16px)]'
/** Panneau de la recherche et de l'entraînement automatique, plus haut : leur bouton Annuler reste loin du bord, au même endroit. */
const PANEL_RAISED = 'absolute inset-x-4 bottom-[calc(var(--jo-safe-bottom,0px)+40px)]'

function useSecondsLeft(deadlineAt: string | null) {
  const [now, setNow] = useState(readServerNow)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(readServerNow()), 250)
    return () => window.clearInterval(timer)
  }, [])
  return deadlineAt ? Math.max(0, Math.ceil((Date.parse(deadlineAt) - now) / 1000)) : null
}

/** Mode de la partie, seul en haut : toutes les actions sont en bas, à portée de pouce. */
function Chrome() {
  const t = useT()
  return (
    <div className="absolute inset-x-4 top-[calc(var(--jo-safe-top,0px)+12px)] flex justify-center">
      <span className="jo-type-caption rounded-jo-full bg-jo-glass px-3 py-1 font-semibold text-jo-muted">{t('mm.ranked')}</span>
    </div>
  )
}

function Dark({ children }: { children: ReactNode }) {
  return (
    <div data-jo-theme="dark" className="relative h-full overflow-hidden bg-jo-bg text-jo-text">
      {children}
    </div>
  )
}

/**
 * Recherche d'adversaire (`matchmaking.md`, lab `matchmaking.tsx`) : plein écran sombre, carte en fond, décompte sur
 * l'échéance serveur (`deadlineAt`). À l'expiration : entraînement automatique (préférence du profil) ou les choix.
 * Écran poussé : annuler ou fermer revient en arrière ; quitter pendant la recherche supprime le ticket.
 */
export function MatchmakingPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const ticketId = params.get('ticket') ?? ''
  const topic = (location.state as { topic?: PlayTopic } | null)?.topic
  useServerClock()
  const ticket = useMatchmakingStream(ticketId || undefined)
  const status = ticket.state?.status ?? 'SEARCHING'
  const seconds = useSecondsLeft(ticket.state?.deadlineAt ?? null)
  const autoTrain = useAutoTrain()
  const difficulty = useBotDifficulty((state) => state.difficulty)
  const [friendOpen, setFriendOpen] = useState(false)
  const mounted = useRef(true)
  useEffect(
    () => () => {
      mounted.current = false
    },
    [],
  )

  const roomId = ticket.state?.roomId ?? null
  const room = useRoom(roomId ?? undefined)
  // `MATCHED` porte l'adversaire enrichi ; la salle reste le repli.
  const opponent = ticket.state?.opponent ?? room.data?.opponent ?? null
  const opponentAvatar = useUserAvatar(opponent)
  const identity = usePlayerIdentity()
  const topicId = topic?.topicId ?? ticket.state?.topicId ?? room.data?.topic.topicId ?? ''
  // Rechargement sans état de navigation : le nom vient de la fiche du sujet.
  const overview = useTopicOverview(topic?.name || !topicId ? undefined : topicId)
  const topicLabel = topic?.name ?? (overview.data ? topicName(overview.data.topic.names, language) : '')
  const rating = opponent?.rating ?? null
  const tier = rating !== null ? tierOf(rating) : undefined
  const country = opponent?.country ? new Intl.DisplayNames([language], { type: 'region' }).of(opponent.country) : undefined
  const meta = [tier ? tokens.tier[tier].label : undefined, rating !== null ? String(rating) : undefined, country, t('mm.starting')].filter(Boolean).join(' · ')

  const back = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.topics, { replace: true }))
  const closeRooms = useCancelRooms()
  const toRoom = (id: string) => {
    // Écran quitté entre-temps (« Annuler l'entraînement ») : la salle créée trop tard est fermée.
    if (!mounted.current) {
      closeRooms.mutate([id])
      return
    }
    void navigate(ROUTES.room(id), { replace: true, state: { topic } })
  }
  const botRoom = useCreateBotRoom()
  const botRoomError = useBotRoomError()
  const train = () => botRoom.mutate({ topicId, difficulty }, { onSuccess: ({ id }) => toRoom(id), onError: botRoomError })
  const enqueue = useEnqueueMatchmaking()
  const retry = () =>
    enqueue.mutate(topicId, {
      onSuccess: (next) => void navigate(ROUTES.play(next.ticketId), { replace: true, state: { topic } }),
      onError: () => toast.error(t('play.matchmakingError'), t('home.errorText')),
    })
  const cancelTicket = useCancelMatchmaking()

  // Adversaire trouvé : 1,2 s sur sa carte, puis la salle prépare le duel.
  useEffect(() => {
    if (status !== 'MATCHED' || !roomId) return
    const timer = window.setTimeout(() => toRoom(roomId), ticket.state?.vsBot ? 0 : FOUND_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, roomId])

  // Expiré, réglage activé : l'entraînement démarre seul. Échec : retour.
  useEffect(() => {
    if (status === 'EXPIRED' && autoTrain.enabled && topicId && botRoom.isIdle) train()
    if (status === 'FAILED') {
      toast.error(t('mm.failed'), t('mm.failedText'))
      back()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, topicId])

  // Quitter l'écran pendant la recherche (ou perdre la connexion) l'annule : le serveur le constate.
  // « Annuler la recherche » est une intention du joueur : la commande part, l'écran se ferme sans attendre.
  const cancelSearch = () => {
    cancelTicket.mutate(ticketId)
    back()
  }
  useTicketPresence(ticketId, status === 'SEARCHING')

  if (status === 'MATCHED') {
    return (
      <Dark>
        <MatchmakingMap state="found" opponent={{ name: opponent?.pseudonym ?? t('topic.opponent'), src: opponentAvatar, ...FOUND_AT, label: opponent?.pseudonym }} />
        <div className={cn(PANEL, 'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-jo-lg bg-jo-surface p-4 ring-1 ring-jo-border')}>
          <Avatar name={opponent?.pseudonym ?? t('topic.opponent')} src={opponentAvatar} tier={tier} size="lg" />
          <div className="grid min-w-0">
            <span className="jo-type-caption font-semibold text-jo-correct">{t('mm.found')}</span>
            <PlayerName name={opponent?.pseudonym ?? t('topic.opponent')} premium={identity.premium(opponent)} className="jo-type-headline" />
            <span className="jo-type-caption text-jo-muted">{meta}</span>
          </div>
          <CheckCircleIcon size={30} weight="fill" className="text-jo-correct" aria-hidden />
        </div>
      </Dark>
    )
  }

  if (status === 'EXPIRED' && autoTrain.enabled) {
    return (
      <Dark>
        <MatchmakingMap pins={PINS} />
        <Chrome />
        {/* Plus haut et plus espacé (2026-11-15) : « Annuler l'entraînement » à portée de pouce, loin du bord. */}
        <div className={cn(PANEL_RAISED, 'grid gap-6')}>
          <Notice tone="training" title={t('mm.autoTitle')} message={t('mm.autoText')} />
          <Button variant="tinted" tone="destructive" size="L" full onClick={back}>
            {t('mm.cancelTraining')}
          </Button>
        </div>
      </Dark>
    )
  }

  if (status === 'EXPIRED' || status === 'CANCELLED') {
    return (
      <Dark>
        <MatchmakingMap pins={[]} />
        <Chrome />
        <div className={cn(PANEL, 'rounded-jo-xl bg-jo-surface ring-1 ring-jo-border')}>
          <EmptyState
            icon={RobotIcon}
            title={t('mm.noneTitle')}
            description={t('mm.noneText', { topic: topicLabel })}
            action={
              <div className="grid gap-2">
                <Button full size="L" icon={RobotIcon} loading={botRoom.isPending} onClick={train}>
                  {t('mm.train')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="tinted" full loading={enqueue.isPending} onClick={retry}>
                    {t('mm.retry')}
                  </Button>
                  <Button variant="gray" tone="neutral" full onClick={() => setFriendOpen(true)}>
                    {t('mm.friend')}
                  </Button>
                </div>
                <Button variant="plain" tone="neutral" full onClick={back}>
                  {t('play.close')}
                </Button>
              </div>
            }
            className="py-6"
          />
        </div>
        {topicId && <DuelSheet open={friendOpen} onClose={() => setFriendOpen(false)} topic={{ topicId, name: topicLabel, category: topic?.category }} startStep="player" direct />}
      </Dark>
    )
  }

  return (
    <Dark>
      <MatchmakingMap pins={PINS} />
      <Chrome />
      {/* Même hauteur que l'entraînement automatique (2026-11-15) : « Annuler la recherche » au même endroit. */}
      <div className={cn(PANEL_RAISED, 'grid justify-items-center gap-3 text-center')}>
        <strong className="jo-type-title-2">{topicLabel}</strong>
        <span className="jo-type-callout inline-flex h-10 items-center gap-3 rounded-jo-full bg-jo-accent px-4 font-semibold text-jo-on-accent">
          {t('mm.searching')}
          {seconds !== null && (
            <span role="timer" className="font-mono">
              {seconds} s
            </span>
          )}
        </span>
        <Button variant="tinted" tone="destructive" size="L" full onClick={cancelSearch}>
          {t('mm.cancel')}
        </Button>
      </div>
    </Dark>
  )
}
