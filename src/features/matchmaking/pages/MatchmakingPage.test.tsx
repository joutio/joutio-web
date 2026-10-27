// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { useMatchmakingPreferencesStore } from "../stores/useMatchmakingPreferencesStore"
import { MatchmakingPage } from "./MatchmakingPage"

const botMutate = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useMatchmaking", () => ({
  useMatchmakingTicket: () => ({
    ticket: {
      ticketId: "ticket-1",
      topicId: "topic-1",
      status: "EXPIRED",
      roomId: null,
      opponentId: null,
      vsBot: false,
      deadlineAt: null,
    },
    isLoading: false,
    isError: false,
  }),
  useStartMatchmaking: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelMatchmaking: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/features/rooms", () => ({
  useStartBotGame: () => ({
    mutate: botMutate,
    isPending: false,
    isError: false,
  }),
}))

vi.mock("@/features/topic-detail", () => ({
  useTopicOverview: () => ({
    data: {
      topic: {
        names: { fr: "Histoire" },
        emoji: "🏛️",
        color: "#f00",
        imageUrl: null,
        category: null,
        categoryLabel: null,
      },
    },
  }),
}))

vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "Sujet",
}))

vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({
    serverNow: () => Date.now(),
    synced: true,
    resync: vi.fn(),
  }),
}))

vi.mock("@/features/game", () => ({
  BotTrainingDialog: () => null,
}))

beforeEach(async () => {
  botMutate.mockReset()
  useMatchmakingPreferencesStore.setState({ autoTrainOnTimeout: true })
  await i18n.changeLanguage("fr")
})

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/matchmaking/ticket-1"]}>
      <Routes>
        <Route path="/matchmaking/:ticketId" element={<MatchmakingPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("MatchmakingPage — repli bot", () => {
  it("lance automatiquement un entraînement normal quand la préférence est active", async () => {
    renderPage()

    await waitFor(() => {
      expect(botMutate).toHaveBeenCalledWith({
        topicId: "topic-1",
        difficulty: "NORMAL",
      })
    })
    expect(screen.queryByText("Aucun adversaire trouvé")).toBeNull()
  })

  it("conserve la popup de choix quand la préférence est désactivée", () => {
    useMatchmakingPreferencesStore.setState({ autoTrainOnTimeout: false })
    renderPage()

    expect(screen.getByText("Aucun adversaire trouvé")).toBeInTheDocument()
    expect(botMutate).not.toHaveBeenCalled()
  })
})
