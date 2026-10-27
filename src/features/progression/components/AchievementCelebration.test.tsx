// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, beforeEach, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { queryKeys } from "@/lib/query-keys"
import type { TopicOverview } from "@/features/topics/domain/topic"
import type { Achievement } from "../domain/achievement"
import { useAchievementStore } from "../stores/useAchievementStore"
import { AchievementCelebration } from "./AchievementCelebration"

/** Vue sujet déjà en cache (la popup de titre s'appuie dessus pour nommer le titre). */
const TOPIC_OVERVIEW: TopicOverview = {
  topic: {
    topicId: "topic-1",
    names: { fr: "Histoire" },
    description: null,
    category: null,
    categoryLabel: null,
    emoji: null,
    color: null,
    imageUrl: null,
    bannerUrl: null,
    followersCount: 0,
    questionsCount: 0,
    followed: false,
    status: "PUBLISHED",
  },
  titles: { fr: { FER: "Historien de fer" } },
  myRank: null,
  myProgress: {
    xp: 0,
    games: 1,
    completedQuestions: 0,
    totalQuestions: 0,
    completionPercent: 0,
    tier: "FER",
    tierProgressPercent: 0,
    tierRemainingXp: 300,
    nextTier: "BRONZE",
  },
  canManage: false,
}

function renderCelebration(
  achievement: Achievement,
  queued = 1,
  overview?: TopicOverview
) {
  useAchievementStore.setState({
    queue: Array.from({ length: queued }, () => achievement),
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  if (overview) {
    client.setQueryData(
      queryKeys.topics.overview(overview.topic.topicId),
      overview
    )
  }
  return render(
    <QueryClientProvider client={client}>
      <AchievementCelebration achievement={achievement} />
    </QueryClientProvider>
  )
}

beforeAll(async () => i18n.changeLanguage("fr"))
beforeEach(() => useAchievementStore.setState({ queue: [] }))

describe("AchievementCelebration", () => {
  it("célèbre un badge : nom traduit, palier et prochain palier explicite", () => {
    renderCelebration({
      kind: "BADGE",
      code: "DUELIST_ARGENT",
      label: "Bretteur",
      family: "VOLUME",
      tier: "ARGENT",
      metric: "HUMAN_DUELS",
      target: 10,
      at: "2026-10-15T18:00:00Z",
    })

    expect(screen.getByText("Succès")).toBeInTheDocument()
    expect(screen.getByText("Bretteur")).toBeInTheDocument()
    expect(
      screen.getByText(/Objectif atteint : Joue 10 duel/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Prochain palier : Or — Lame d'élite/)
    ).toBeInTheDocument()
  })

  it("affiche la condition dédiée d'un exploit", () => {
    renderCelebration({
      kind: "BADGE",
      code: "PERFECT",
      label: "Perfectionniste",
      family: "EXPLOIT",
      tier: "OR",
      metric: "ONE_SHOT",
      target: 1,
      at: "2026-10-15T18:00:00Z",
    })

    expect(
      screen.getByText(
        /Objectif atteint : Termine un duel avec le score maximal/
      )
    ).toBeInTheDocument()
  })

  it("célèbre un palier maximal sans annoncer de suite", () => {
    renderCelebration({
      kind: "BADGE",
      code: "DUELIST_DIAMANT",
      label: "Mythe vivant",
      family: "VOLUME",
      tier: "DIAMANT",
      metric: "HUMAN_DUELS",
      target: 1_000,
      at: "2026-10-15T18:00:00Z",
    })

    expect(screen.getByText(/palier le plus rare/)).toBeInTheDocument()
  })

  it("célèbre un titre avec l'aperçu du ruban et son libellé", () => {
    renderCelebration(
      {
        kind: "TITLE",
        topicId: "topic-1",
        tier: "FER",
        at: "2026-10-15T18:00:00Z",
      },
      1,
      TOPIC_OVERVIEW
    )

    const ribbon = screen.getByRole("img", { name: "Historien de fer" })
    const art = ribbon.parentElement?.querySelector("img")
    // Le ruban du rang porte le titre, comme sur le profil.
    expect(art?.getAttribute("src")).toContain("ruban-fer")
    expect(ribbon).toHaveTextContent("Historien de fer")
    // Plus de médaille à couronne ni de palier/pastille de rang en doublon.
    expect(document.querySelector(".lucide-crown")).toBeNull()
    expect(screen.queryByRole("heading", { name: "Fer" })).toBeNull()
    expect(screen.queryByText("Fer")).toBeNull()
  })

  it("passe au déblocage suivant à la fermeture", async () => {
    const achievement: Achievement = {
      kind: "BADGE",
      code: "PERFECT",
      label: "Perfectionniste",
      family: "EXPLOIT",
      tier: "OR",
      metric: "ONE_SHOT",
      target: 1,
      at: "2026-10-15T18:00:00Z",
    }
    renderCelebration(achievement)

    await userEvent.click(screen.getByRole("button", { name: "Super !" }))

    expect(useAchievementStore.getState().queue).toEqual([])
  })
})
