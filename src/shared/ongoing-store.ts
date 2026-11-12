import { create } from 'zustand'

/** Partie en cours du joueur, montrée par le bandeau « Partie en cours » (`etats-systeme.md`, Reprendre une partie). */
export type OngoingGame = { gameId: string; topicId: string; topicName: string; category: string | null; createdAt: string }

/**
 * Parties en cours et salons suivis, pour toute l'app connectée. Un salon visité reste suivi après l'avoir quitté :
 * la partie qu'il crée ensuite apparaît dans le bandeau, sans redirection. Une partie finie ne revient pas.
 */
export const useOngoingStore = create<{
  games: OngoingGame[]
  rooms: string[]
  finished: string[]
  retired: string[]
  trackRoom: (roomId: string) => void
  retireRoom: (roomId: string) => void
  rememberGame: (game: OngoingGame) => void
  finishGame: (gameId: string) => void
  reset: () => void
}>((set) => ({
  games: [],
  rooms: [],
  finished: [],
  retired: [],
  trackRoom: (roomId) => set((state) => (state.retired.includes(roomId) || state.rooms.includes(roomId) ? state : { rooms: [...state.rooms, roomId] })),
  retireRoom: (roomId) => set((state) => ({ retired: [...state.retired, roomId], rooms: state.rooms.filter((id) => id !== roomId) })),
  rememberGame: (game) =>
    set((state) => (state.finished.includes(game.gameId) || state.games.some((item) => item.gameId === game.gameId) ? state : { games: [...state.games, game] })),
  finishGame: (gameId) => set((state) => ({ finished: [...state.finished, gameId], games: state.games.filter((item) => item.gameId !== gameId) })),
  reset: () => set({ games: [], rooms: [], finished: [], retired: [] }),
}))
