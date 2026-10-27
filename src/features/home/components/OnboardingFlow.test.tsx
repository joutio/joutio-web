// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics/domain/topic"
import { OnboardingFlow } from "./OnboardingFlow"

const mocks = vi.hoisted(() => ({
  updateInterests: vi.fn(),
  completeOnboarding: vi.fn(),
  startBot: vi.fn(),
  recommendations: vi.fn(),
}))

const categories = vi.hoisted(() => [
  { code: "HISTORY", label: "Histoire" },
  { code: "SCIENCE", label: "Sciences" },
  { code: "MOVIES", label: "Cinéma" },
  { code: "SPORTS", label: "Sport" },
])

function topic(id: string, category: string, label: string): TopicCard {
  return {
    topicId: id,
    names: { fr: label },
    description: null,
    category,
    categoryLabel: label,
    emoji: "📚",
    color: "#f00",
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 7,
    followed: false,
    status: "PUBLISHED",
  }
}

const topics = [
  topic("topic-HISTORY", "HISTORY", "Révolution française"),
  topic("topic-SCIENCE", "SCIENCE", "Espace"),
  topic("topic-MOVIES", "MOVIES", "Nouvelle vague"),
]

vi.mock("@/features/topics", () => ({
  InterestProfileForm: ({
    value,
    onChange,
    max = 3,
  }: {
    value: string[]
    onChange: (value: string[]) => void
    max?: number
  }) => (
    <div>
      <span>{`${value.length} / ${max} univers`}</span>
      {categories.map((category) => {
        const selected = value.includes(category.code)
        const disabled = !selected && value.length >= max
        return (
          <button
            key={category.code}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((code) => code !== category.code)
                  : [...value, category.code]
              )
            }
          >
            {category.label}
          </button>
        )
      })}
    </div>
  ),
}))

vi.mock("@/features/shell", () => ({
  useUpdateInterests: () => ({
    mutateAsync: mocks.updateInterests,
    isPending: false,
  }),
  useTopicName: () => (names: { fr?: string } | null | undefined) =>
    names?.fr ?? "Sujet",
}))

vi.mock("@/features/rooms", () => ({
  useStartBotGame: () => ({
    mutate: mocks.startBot,
    isPending: false,
    isError: false,
  }),
}))

vi.mock("../hooks/useCompleteOnboarding", () => ({
  useCompleteOnboarding: () => ({
    mutateAsync: mocks.completeOnboarding,
    isPending: false,
  }),
}))

vi.mock("../hooks/useOnboardingRecommendations", () => ({
  useOnboardingRecommendations: mocks.recommendations,
}))

vi.mock("@/lib/telemetry", () => ({ trackProductEvent: vi.fn() }))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
  mocks.updateInterests.mockReset()
  mocks.updateInterests.mockResolvedValue(undefined)
  mocks.completeOnboarding.mockReset()
  mocks.completeOnboarding.mockResolvedValue({})
  mocks.startBot.mockReset()
  mocks.recommendations.mockReset()
  mocks.recommendations.mockImplementation((interests: string[]) => ({
    data: interests.length > 0 ? topics : [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }))
})

function renderFlow(returnTo?: string) {
  return render(
    <MemoryRouter>
      <OnboardingFlow returnTo={returnTo} />
    </MemoryRouter>
  )
}

async function chooseHistory() {
  fireEvent.click(screen.getByRole("button", { name: "Histoire" }))
  fireEvent.click(screen.getByRole("button", { name: "Voir mon thème" }))
  await screen.findByText("Ton premier thème")
}

describe("OnboardingFlow", () => {
  it("recommande un thème à partir des univers puis lance un duel bot", async () => {
    renderFlow()
    fireEvent.click(screen.getByRole("button", { name: "Histoire" }))
    fireEvent.click(screen.getByRole("button", { name: "Sciences" }))
    expect(screen.getByText("2 / 3 univers")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Voir mon thème" }))
    await screen.findByText("Ton premier thème")

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Découvrir le duel" })
      ).toBeEnabled()
    )
    fireEvent.click(screen.getByRole("button", { name: "Découvrir le duel" }))

    await waitFor(() => {
      expect(mocks.updateInterests).toHaveBeenCalledWith(["HISTORY", "SCIENCE"])
      expect(mocks.completeOnboarding).toHaveBeenCalledTimes(1)
      expect(mocks.startBot).toHaveBeenCalledWith({
        topicId: "topic-HISTORY",
        difficulty: "NORMAL",
      })
    })
  })

  it("limite la sélection à 3 univers", () => {
    renderFlow()
    for (const label of ["Histoire", "Sciences", "Cinéma", "Sport"]) {
      fireEvent.click(screen.getByRole("button", { name: label }))
    }

    expect(screen.getByText("3 / 3 univers")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sport" })).toBeDisabled()
  })

  it("peut être passé sans enregistrer d'intérêts ni lancer de duel", async () => {
    renderFlow()
    fireEvent.click(screen.getByRole("button", { name: "Passer" }))

    await waitFor(() =>
      expect(mocks.completeOnboarding).toHaveBeenCalledTimes(1)
    )
    expect(mocks.updateInterests).not.toHaveBeenCalled()
    expect(mocks.startBot).not.toHaveBeenCalled()
  })

  it("rejoint la salle en priorité quand une invitation est en attente", async () => {
    renderFlow("/join/room-1")
    await chooseHistory()

    fireEvent.click(screen.getByRole("button", { name: "Rejoindre la salle" }))

    await waitFor(() =>
      expect(mocks.completeOnboarding).toHaveBeenCalledTimes(1)
    )
    expect(mocks.startBot).not.toHaveBeenCalled()
  })

  it("ne lance pas la partie si les intérêts n'ont pas pu être enregistrés", async () => {
    mocks.updateInterests.mockRejectedValueOnce(new Error("offline"))
    renderFlow()
    await chooseHistory()

    fireEvent.click(screen.getByRole("button", { name: "Découvrir le duel" }))

    await waitFor(() =>
      expect(
        screen.getByText("Impossible d'enregistrer ton onboarding. Réessaie.")
      ).toBeInTheDocument()
    )
    expect(mocks.completeOnboarding).not.toHaveBeenCalled()
    expect(mocks.startBot).not.toHaveBeenCalled()
  })
})
