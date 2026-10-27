// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { StreakSection } from "./StreakSection"

vi.mock("@/features/player", () => ({
  useProfileActivity: () => ({
    isLoading: false,
    data: {
      userId: "user-1",
      currentStreak: 3,
      longestStreak: 9,
      lastActiveDate: "2026-03-03",
      totalActiveDays: 2,
      days: [
        { date: "2026-03-02", games: 1 },
        { date: "2026-03-03", games: 2 },
      ],
    },
  }),
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("StreakSection", () => {
  it("affiche la série courante, le record et le calendrier", () => {
    render(<StreakSection userId="user-1" />)

    expect(screen.getByText("Série de présence")).toBeInTheDocument()
    expect(screen.getByText("Série actuelle")).toBeInTheDocument()
    expect(screen.getByText("Record")).toBeInTheDocument()
    expect(screen.getByText("9")).toBeInTheDocument()
    expect(
      screen.getByRole("grid", { name: /calendrier de ta série/i })
    ).toBeInTheDocument()
  })
})
