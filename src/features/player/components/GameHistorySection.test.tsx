// @vitest-environment jsdom
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { GameHistoryItem } from "../domain/history"
import { useGameHistory } from "../hooks/usePlayer"
import { GameHistorySection } from "./GameHistorySection"

vi.mock("../hooks/usePlayer", () => ({
  useGameHistory: vi.fn(),
}))

vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "Sujet",
}))

// Barre en mode desktop : les sélecteurs sont directement accessibles.
vi.mock("@/shared/hooks/use-device", () => ({
  useDevice: () => "desktop",
  useIsTouchLayout: () => false,
}))

const game: GameHistoryItem = {
  gameId: "game-1",
  topic: {
    topicId: "topic-1",
    names: { fr: "Histoire" },
    category: null,
    emoji: null,
    color: null,
    imageUrl: null,
    titles: null,
  },
  opponent: {
    userId: "player-1",
    pseudonym: "Bob",
    avatarOptions: null,
  },
  opponentType: "HUMAN",
  outcome: "WIN",
  myScore: 120,
  opponentScore: 90,
  xp: null,
  playedAt: "2026-10-17T10:00:00Z",
}

const history = {
  items: [],
  total: 0,
  isLoading: false,
  isError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: vi.fn(),
  refetch: vi.fn(),
}

function renderSection(opponentId?: string) {
  return render(
    <MemoryRouter initialEntries={["/players/player-1"]}>
      <GameHistorySection
        userId="me"
        opponentId={opponentId}
        empty={<p>aucune partie</p>}
      />
    </MemoryRouter>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  vi.mocked(useGameHistory).mockReset()
  vi.mocked(useGameHistory).mockReturnValue(history)
})

describe("GameHistorySection — fiche d'un autre joueur", () => {
  it("impose l'adversaire et masque le filtre de type", () => {
    renderSection("player-1")

    expect(useGameHistory).toHaveBeenLastCalledWith(
      "me",
      expect.objectContaining({ opponentId: "player-1" })
    )
    expect(
      screen.queryByLabelText("Filtrer l'historique par type d'adversaire")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Contre moi" })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText("Filtrer l'historique par issue")).toBeInTheDocument()
    expect(screen.getByLabelText("Trier l'historique")).toBeInTheDocument()
    expect(screen.getByText("aucune partie")).toBeInTheDocument()
  })

  it("masque l'adversaire dans les cartes de la section scopée", () => {
    vi.mocked(useGameHistory).mockReturnValue({
      ...history,
      items: [game],
      total: 1,
    })

    renderSection("player-1")

    expect(screen.getByText("Histoire")).toBeInTheDocument()
    expect(screen.queryByText(/contre/i)).not.toBeInTheDocument()
    expect(screen.queryByText("Bob")).not.toBeInTheDocument()
  })
})

describe("GameHistorySection — son propre profil", () => {
  it("garde le filtre de type d'adversaire et ne filtre aucun adversaire", () => {
    renderSection()

    expect(useGameHistory).toHaveBeenLastCalledWith(
      "me",
      expect.objectContaining({ opponentId: undefined })
    )
    expect(
      screen.getByLabelText("Filtrer l'historique par type d'adversaire")
    ).toBeInTheDocument()
  })
})
