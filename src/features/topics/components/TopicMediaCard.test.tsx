// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { TopicCard } from "@/features/topics/domain/topic"
import { TopicMediaCard } from "./TopicMediaCard"

vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "",
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

const TOPIC: TopicCard = {
  topicId: "topic-breaking-bad",
  names: { fr: "Breaking Bad", en: "Breaking Bad" },
  description: null,
  category: "TELEVISION",
  categoryLabel: "Télévision",
  emoji: null,
  color: "#f59e0b",
  imageUrl: "https://example.com/cover.jpg",
  bannerUrl: "https://example.com/banner.jpg",
  followersCount: 12,
  questionsCount: 7,
  followed: false,
  status: "PUBLISHED",
}

describe("TopicMediaCard", () => {
  it("affiche le titre, la catégorie et le rang du Top 10 en format poster", () => {
    render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" rank={3} />
    )

    const card = screen.getByRole("button", {
      name: "N° 3 — Breaking Bad",
    })
    expect(card).toHaveAttribute("data-format", "poster")
    const category = screen.getByText("Séries & TV")
    expect(category).toHaveAttribute("data-slot", "topic-card-category")
    expect(category.getAttribute("style")).toContain("color-mix")
    expect(category.getAttribute("style")).toContain("#f59e0b")
  })

  it("utilise la bannière en paysage, sans rang", () => {
    const { container } = render(
      <TopicMediaCard
        topic={TOPIC}
        onOpen={vi.fn()}
        format="landscape"
        rank={2}
      />
    )

    const card = screen.getByRole("button", { name: "Breaking Bad" })
    expect(card).toHaveAttribute("data-format", "landscape")
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/banner.jpg"
    )
    expect(
      container.querySelector('[data-slot="topic-card-media"]')
    ).toHaveClass("aspect-video")
    expect(card).toHaveClass("border", "border-border")
    expect(screen.queryByText("2")).toBeNull()
  })

  it("conserve le ratio 5:8, le pied intégré et la bordure du Top 10", () => {
    const { container } = render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" rank={3} />
    )

    const card = screen.getByRole("button", { name: "N° 3 — Breaking Bad" })
    expect(card).toHaveClass(
      "aspect-[5/8]",
      "border",
      "border-border",
      "shadow-none"
    )
    expect(
      container.querySelector('[data-slot="topic-card-media"]')
    ).toHaveClass("flex-1")
    expect(
      container.querySelector('[data-slot="topic-card-footer"]')
    ).toHaveClass("h-16", "bg-card")
    const rank = container.querySelector('[data-slot="topic-rank"]')
    expect(rank).toHaveAttribute("data-rank", "3")
    expect(rank?.getAttribute("src")).toMatch(/^data:image\/svg\+xml/)
    expect(rank).toHaveAttribute("alt", "")
    expect(rank).toHaveAttribute("aria-hidden", "true")
    expect(rank).toHaveClass(
      "top-4",
      "-left-[42px]",
      "h-auto",
      "w-auto",
      "qu-rank"
    )
  })

  it("aligne le rang 1 sur le bord du ScrollArea", () => {
    const { container } = render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" rank={1} />
    )

    expect(container.querySelector('[data-slot="topic-rank"]')).toHaveClass(
      "-left-[25.346px]"
    )
  })

  it("affiche le rang 10 avec le même gabarit que les autres rangs", () => {
    const { container } = render(
      <TopicMediaCard
        topic={TOPIC}
        onOpen={vi.fn()}
        format="poster"
        rank={10}
      />
    )

    expect(
      screen.getByRole("button", { name: "N° 10 — Breaking Bad" })
    ).toBeInTheDocument()
    const rank = container.querySelector('[data-slot="topic-rank"]')
    expect(rank).toHaveAttribute("data-rank", "10")
    expect(rank?.getAttribute("src")).toMatch(/^data:image\/svg\+xml/)
    expect(rank).toHaveClass(
      "top-4",
      "-left-[42px]",
      "h-auto",
      "w-auto",
      "qu-rank"
    )
  })

  it("utilise la couverture en poster", () => {
    const { container } = render(
      <TopicMediaCard topic={TOPIC} onOpen={vi.fn()} format="poster" />
    )

    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "https://example.com/cover.jpg"
    )
  })

  it("ouvre le sujet au clic", () => {
    const onOpen = vi.fn()
    render(<TopicMediaCard topic={TOPIC} onOpen={onOpen} format="landscape" />)

    fireEvent.click(screen.getByRole("button", { name: "Breaking Bad" }))

    expect(onOpen).toHaveBeenCalledWith("topic-breaking-bad")
  })
})
