// @vitest-environment jsdom
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { PlayerProfile } from "../domain/profile"

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  headToHead: vi.fn(),
  toggleFollow: vi.fn(),
}))

vi.mock("../hooks/usePlayer", () => ({
  usePlayerProfile: mocks.profile,
  useHeadToHead: mocks.headToHead,
  useToggleUserFollow: () => ({
    toggle: mocks.toggleFollow,
    isPending: false,
  }),
}))

vi.mock("@/features/shell", () => ({
  PageContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}))

vi.mock("@/shared/components/user-avatar", () => ({
  UserAvatar: () => <span data-testid="bot-avatar" />,
}))

import { PlayerProfilePage } from "./PlayerProfilePage"

const PROFILE: PlayerProfile = {
  userId: "bot-1",
  pseudonym: "QuizMeUp Bot",
  bio: null,
  country: null,
  avatarOptions: null,
  bannerUrl: null,
  isMe: false,
  following: false,
  presence: null,
  progression: {
    badges: [],
    rating: 200,
    peakRating: 200,
    ratedGames: 0,
    provisional: true,
  },
  stats: {
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winPercent: 0,
    bestScore: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
  },
  followersCount: 0,
  followingCount: 0,
  bot: true,
}

function renderBotProfile() {
  return render(
    <MemoryRouter initialEntries={["/players/bot-1"]}>
      <Routes>
        <Route path="/players/:playerId" element={<PlayerProfilePage />} />
      </Routes>
    </MemoryRouter>
  )
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("PlayerProfilePage — compte bot", () => {
  it("réduit la fiche à l'avatar et au nom", () => {
    mocks.profile.mockReturnValue({
      data: PROFILE,
      isLoading: false,
      isError: false,
    })

    renderBotProfile()

    expect(
      screen.getByRole("heading", { name: "QuizMeUp Bot" })
    ).toBeInTheDocument()
    expect(screen.getByTestId("bot-avatar")).toBeInTheDocument()
    expect(screen.queryByText("Défier")).not.toBeInTheDocument()
    expect(screen.queryByText("Abonnés")).not.toBeInTheDocument()
    expect(screen.queryByText("Niveau 1")).not.toBeInTheDocument()
    expect(screen.queryByRole("tab")).not.toBeInTheDocument()
  })
})
