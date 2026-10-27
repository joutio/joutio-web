// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { Home } from "../domain/home"
import { HomePage } from "./HomePage"

const useHome = vi.hoisted(() => vi.fn())

vi.mock("../hooks/useHome", () => ({ useHome }))
vi.mock("@/shared/hooks/usePreloadImages", () => ({
  usePreloadImages: vi.fn(),
}))
vi.mock("@/features/topics", () => ({
  TopicCarousel: ({
    topics,
    label,
  }: {
    topics: { topicId: string }[]
    label: string
  }) => (
    <div data-testid={`carousel-${label}`}>
      {topics.map((t) => t.topicId).join(",")}
    </div>
  ),
}))

function topic(topicId: string) {
  return {
    topicId,
    names: { fr: topicId },
    description: null,
    category: "HISTORY",
    categoryLabel: "Histoire",
    emoji: "📚",
    color: "#f00",
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 7,
    followed: false,
    status: "PUBLISHED" as const,
  }
}

function home(patch: Partial<Home>): Home {
  return {
    followedTopics: [],
    trendingTopics: [],
    newTopics: [],
    recommendedTopics: [],
    ...patch,
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("HomePage", () => {
  it("affiche le rail « Pour toi » après « Nouveaux thèmes »", () => {
    useHome.mockReturnValue({
      data: home({
        recommendedTopics: [topic("recommended-1")],
        trendingTopics: [topic("trending-1")],
        followedTopics: [topic("followed-1")],
        newTopics: [topic("new-1")],
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    const carousels = screen
      .getAllByTestId(/^carousel-/)
      .map((element) => element.getAttribute("data-testid"))
    expect(carousels).toEqual([
      "carousel-Top 10 du moment",
      "carousel-Tes sujets suivis",
      "carousel-Nouveaux thèmes",
      "carousel-Pour toi",
    ])
    expect(screen.getByTestId("carousel-Pour toi")).toHaveTextContent(
      "recommended-1"
    )
  })

  it("masque le rail sans recommandation", () => {
    useHome.mockReturnValue({
      data: home({ trendingTopics: [topic("trending-1")] }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(screen.queryByText("Pour toi")).not.toBeInTheDocument()
  })
})
