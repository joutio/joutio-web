import { useQuery } from '@tanstack/react-query'
import { useContext, useEffect, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { gameService, useGameStream } from '@/features/duel'
import { useMe } from '@/features/me'
import { playService, useRoom } from '@/features/play'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useConnectionStore, usePersonalNotifications } from '@/lib/realtime'
import { useOngoingStore } from '@/shared/ongoing-store'
import { ROUTES } from '@/shared/routes'
import { topicName } from '@/shared/topics'
import { Banner, GlobalBannerContext } from '@/ui'

const CLOSED = ['CANCELLED', 'EXPIRED', 'FAILED']

/** Un salon suivi : la partie qu'il crée rejoint les parties en cours, puis il n'est plus suivi. */
function RoomWatch({ roomId }: { roomId: string }) {
  const language = useLanguageStore((state) => state.language)
  const { room, view, status } = useRoom(roomId)
  const rememberGame = useOngoingStore((state) => state.rememberGame)
  const retireRoom = useOngoingStore((state) => state.retireRoom)
  const gameId = room?.gameId ?? view.data?.gameId
  useEffect(() => {
    if (gameId && view.data) {
      const { topic, updatedAt } = view.data
      rememberGame({ gameId, topicId: topic.topicId, topicName: topicName(topic.names, language), category: topic.category, createdAt: updatedAt })
      retireRoom(roomId)
    } else if (status?.terminalError || (room && CLOSED.includes(room.status))) retireRoom(roomId)
  }, [gameId, view.data, room, status?.terminalError, roomId, language, rememberGame, retireRoom])
  return null
}

/** Une partie en cours : elle quitte le bandeau dès qu'elle se termine, est abandonnée ou annulée. */
function GameWatch({ gameId }: { gameId: string }) {
  const { state, status } = useGameStream(gameId)
  const finishGame = useOngoingStore((state) => state.finishGame)
  useEffect(() => {
    if (status?.terminalError || (status?.loaded && state && state.status !== 'IN_PROGRESS')) finishGame(gameId)
  }, [gameId, state, status?.loaded, status?.terminalError, finishGame])
  return null
}

/**
 * Reprendre une partie (`etats-systeme.md`, repris du mobile) : parties actives relues au démarrage, au retour de
 * l'onglet et de la connexion, et à chaque défi accepté ; salons visités suivis en temps réel. Aucun polling. Le bandeau
 * « Partie en cours » (sujet, Rejoindre) prend la place globale ; la bannière de connexion l'emporte. Sans redirection
 * automatique ; il disparaît dans l'arène de cette partie.
 */
export function OngoingRuntime({ children }: { children: ReactNode }) {
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const language = useLanguageStore((state) => state.language)
  const userId = useMe().data?.userId
  const connection = useConnectionStore((state) => state.status)
  const { games, rooms, rememberGame, trackRoom, reset } = useOngoingStore()
  const active = useQuery({ queryKey: ['games', 'active', userId], queryFn: gameService.active, enabled: Boolean(userId) })
  const myRooms = useQuery({ queryKey: ['rooms', 'tracked', userId], queryFn: playService.myRooms, enabled: Boolean(userId) })
  const { refetch: refetchActive } = active
  const { refetch: refetchRooms } = myRooms

  // Un autre compte repart d'une session vide.
  useEffect(() => reset, [userId, reset])
  useEffect(() => {
    if (connection !== 'online' || !userId) return
    void refetchActive()
    void refetchRooms()
  }, [connection, userId, refetchActive, refetchRooms])
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      void refetchActive()
      void refetchRooms()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refetchActive, refetchRooms])
  usePersonalNotifications(userId, (notification, deleted) => {
    if (!deleted && notification.type === 'ROOM_ACCEPTED') {
      void refetchActive()
      void refetchRooms()
    }
  })
  useEffect(() => {
    for (const game of active.data ?? [])
      rememberGame({ gameId: game.gameId, topicId: game.topic.topicId, topicName: topicName(game.topic.names, language), category: game.topic.category, createdAt: game.createdAt })
  }, [active.data, language, rememberGame])
  useEffect(() => {
    for (const room of myRooms.data ?? []) if (!CLOSED.includes(room.status)) trackRoom(room.roomId)
  }, [myRooms.data, trackRoom])

  // La plus ancienne d'abord ; pas dans l'arène de cette même partie.
  const game = [...games].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).find((item) => !location.pathname.startsWith(ROUTES.game(item.gameId)))
  const connectionBanner = useContext(GlobalBannerContext)
  const banner =
    connectionBanner ??
    (game ? (
      <Banner
        tone="live"
        title={t('ongoing.title')}
        message={game.topicName}
        action={{ label: t('ongoing.join'), onClick: () => void navigate(ROUTES.game(game.gameId), { state: { topic: { topicId: game.topicId, name: game.topicName, category: game.category } } }) }}
      />
    ) : null)

  return (
    <GlobalBannerContext.Provider value={banner}>
      {rooms.map((roomId) => (
        <RoomWatch key={roomId} roomId={roomId} />
      ))}
      {games.map((item) => (
        <GameWatch key={item.gameId} gameId={item.gameId} />
      ))}
      {children}
    </GlobalBannerContext.Provider>
  )
}
