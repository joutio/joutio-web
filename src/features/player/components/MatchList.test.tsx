// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { GameHistoryItem } from "../domain/history"
import { MatchList } from "./MatchList"

vi.mock("@/features/shell", () => ({
  useTopicName: () => (names: { fr?: string } | null) => names?.fr ?? "Sujet",
}))

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

function item(outcome: GameHistoryItem["outcome"]): GameHistoryItem {
  return {
    gameId: `game-${outcome}`,
    topic: {
      topicId: "topic-1",
      names: { fr: "Histoire" },
      category: null,
      emoji: null,
      color: null,
      imageUrl: null,
      titles: null,
    },
    opponent: null,
    opponentType: "BOT",
    outcome,
    myScore: 120,
    opponentScore: 90,
    xp: null,
    playedAt: "2026-10-17T10:00:00Z",
  }
}

function renderList(items: GameHistoryItem[], showOpponent = true) {
  return render(
    <MemoryRouter>
      <MatchList items={items} showOpponent={showOpponent} />
    </MemoryRouter>
  )
}

describe("MatchList", () => {
  it("pose une pastille à icône blanche sur un disque assombri", () => {
    renderList([item("WIN"), item("DRAW"), item("LOSS")])

    // Plus aucun libellé texte pour les issues terminées.
    expect(screen.queryByText("Victoire")).toBeNull()
    expect(screen.queryByText("Égalité")).toBeNull()
    expect(screen.queryByText("Défaite")).toBeNull()

    const win = screen.getByRole("img", { name: "Victoire" })
    const draw = screen.getByRole("img", { name: "Égalité" })
    const loss = screen.getByRole("img", { name: "Défaite" })

    expect(win.className).toContain("rounded-full")
    expect(win.className).toContain("text-white")
    // Même disque que la coche d'un titre atteint : 80 % de teinte + noir, sans ombre.
    expect(win.getAttribute("style")).toContain("--success-600")
    expect(win.getAttribute("style")).toContain("80%")
    expect(win.getAttribute("style")).toContain("black")
    expect(win.className).not.toContain("drop-shadow")
    expect(draw.getAttribute("style")).toContain("--draw")
    expect(draw.getAttribute("style")).toContain("80%")
    expect(loss.getAttribute("style")).toContain("--loss")
    expect(loss.getAttribute("style")).toContain("80%")
    expect(win.querySelector(".lucide-check")).not.toBeNull()
    expect(draw.querySelector(".lucide-equal")).not.toBeNull()
    expect(loss.querySelector(".lucide-x")).not.toBeNull()
  })

  it("teinte la carte et le score à la recette de la carte de titre débloquée", () => {
    renderList([item("WIN"), item("DRAW"), item("LOSS")])

    const [winLink, drawLink, lossLink] = screen.getAllByRole("link")
    const winCard = winLink.querySelector('[data-slot="card"]')!
    const drawCard = drawLink.querySelector('[data-slot="card"]')!
    const lossCard = lossLink.querySelector('[data-slot="card"]')!

    // Bordure 40 %, fond 8 % mélangé à --card : la formule des titres débloqués.
    for (const card of [winCard, drawCard, lossCard]) {
      expect(card.getAttribute("style")).toContain("40%")
      expect(card.getAttribute("style")).toContain("8%")
      expect(card.getAttribute("style")).toContain("var(--card)")
      // Au survol, seule la bordure s'accentue (70 %, comme la tuile de badge) :
      // le fond teinté ne bouge pas.
      expect(card.className).toContain(
        "hover:[border-color:var(--match-hover-border)]!"
      )
      expect(card.className).not.toContain("hover:bg-surface-muted")
      expect(card.getAttribute("style")).toContain("--match-hover-border")
      expect(card.getAttribute("style")).toContain("70%")
    }
    expect(winCard.getAttribute("style")).toContain("--success-600")
    expect(drawCard.getAttribute("style")).toContain("--draw")
    expect(lossCard.getAttribute("style")).toContain("--loss")

    // Le score suit la teinte de l'issue (victoire en vert des titres).
    expect(within(winLink).getByText("120").getAttribute("style")).toContain(
      "--success-600"
    )
    expect(within(drawLink).getByText("120").getAttribute("style")).toContain(
      "--draw"
    )
    expect(within(lossLink).getByText("120").getAttribute("style")).toContain(
      "--loss"
    )
  })

  it("place la pastille d'issue à gauche et le visuel du sujet à droite", () => {
    const win = item("WIN")
    win.topic = { ...win.topic, emoji: "🎬" }
    renderList([win])

    const link = screen.getByRole("link")
    const media = link.querySelector('[data-slot="card-media"]')!
    const action = link.querySelector('[data-slot="card-action"]')!

    expect(
      within(media as HTMLElement).getByRole("img", { name: "Victoire" })
    ).toBeInTheDocument()
    expect(media.textContent).not.toContain("🎬")
    expect(action.textContent).toContain("🎬")
  })

  it("place l'avatar adversaire à droite de l'icône du duel", () => {
    const win = item("WIN")
    win.opponent = {
      userId: "user-1",
      pseudonym: "Alice",
      avatarOptions: null,
    }
    renderList([win])

    const link = screen.getByRole("link")
    const header = link.querySelector(
      '[data-slot="card-header"]'
    ) as HTMLElement
    const lead = header.firstElementChild as HTMLElement
    const description = link.querySelector(
      '[data-slot="card-description"]'
    ) as HTMLElement
    const action = link.querySelector(
      '[data-slot="card-action"]'
    ) as HTMLElement

    expect(
      within(lead).getByRole("img", { name: "Victoire" })
    ).toBeInTheDocument()
    expect(
      lead.lastElementChild?.querySelector('[data-slot="avatar"]')
    ).not.toBeNull()
    expect(
      description.querySelector('[data-slot="avatar"]')
    ).not.toBeInTheDocument()
    expect(action.querySelector('[data-slot="avatar"]')).not.toBeInTheDocument()
  })

  it("masque la ligne adversaire quand la section est déjà scopée", () => {
    renderList([item("WIN")], false)

    const link = screen.getByRole("link")
    expect(within(link).queryByText(/contre/i)).toBeNull()
    expect(within(link).queryByText("Bot")).toBeNull()
    expect(link).toHaveAttribute(
      "aria-label",
      "Voir le résultat du duel — Histoire"
    )
  })

  it("garde une carte neutre et le libellé texte des issues non terminées", () => {
    renderList([item("WAITING")])

    expect(screen.getByText("En attente")).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "En attente" })).toBeNull()

    const card = screen.getByRole("link").querySelector('[data-slot="card"]')!
    expect(card.getAttribute("style")).toBeNull()
    expect(card.className).not.toContain("hover:bg-surface-muted")
    expect(card.className).toContain("hover:border-foreground/20")
  })
})
