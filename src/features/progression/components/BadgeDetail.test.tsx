// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { TIER_COLORS, type BadgeItem } from "../domain/progression"
import { BadgeDetail } from "./BadgeDetail"

function badge(overrides: Partial<BadgeItem> = {}): BadgeItem {
  return {
    code: "DUELIST_BRONZE",
    label: "Duelliste",
    tier: "BRONZE",
    metric: "HUMAN_DUELS",
    target: 10,
    earned: false,
    progress: 0,
    ...overrides,
  }
}

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("BadgeDetail", () => {
  it("acquis : coche sur l'objectif, sans palier ni « Débloqué » en texte", () => {
    const { container } = render(
      <BadgeDetail
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
      />
    )

    expect(
      screen.getByText("Joue 10 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(container.querySelector('[data-glyph="check"]')).not.toBeNull()
    const rarity = screen.getByText("Rareté : Bronze")
    expect(rarity).toBeInTheDocument()
    expect(rarity.style.color).toBe(TIER_COLORS.BRONZE.text)
    expect(screen.queryByText("Débloqué")).toBeNull()
    // Acquis : la médaille reste en pleine couleur.
    const medallion = container.querySelector('[data-slot="badge-medallion"]')
    expect(medallion?.className).not.toContain("opacity-")
    expect(medallion?.className).not.toContain("grayscale")
  })

  it("affiche la rareté avec la couleur du palier", () => {
    render(
      <BadgeDetail
        family="VOLUME"
        badge={badge({ tier: "DIAMANT", code: "DUELIST_DIAMANT" })}
      />
    )

    const rarity = screen.getByText("Rareté : Diamant")
    expect(rarity.style.color).toBe(TIER_COLORS.DIAMANT.text)
  })

  it("utilise la grande médaille et la barre de progression canonique", () => {
    const { container } = render(
      <BadgeDetail family="VOLUME" badge={badge({ progress: 7 })} />
    )

    const medallion = container.querySelector('[data-slot="badge-medallion"]')
    expect(medallion?.className).toContain("w-32")
    // Verrouillée : la médaille reprend le traitement d'une récompense verrouillée.
    expect(medallion?.className).toContain("opacity-45")
    expect(medallion?.className).toContain("grayscale")
    expect(container.querySelector('[class*="h-4"]')).not.toBeNull()
  })

  it("verrouillé : objectif et reste à faire sur deux lignes distinctes", () => {
    render(<BadgeDetail family="VOLUME" badge={badge({ progress: 7 })} />)

    expect(
      screen.getByText("Joue 10 duel(s) contre des joueurs")
    ).toBeInTheDocument()
    expect(screen.getByText("Encore 3 duel(s)")).toBeInTheDocument()
    expect(screen.getByText("7 sur 10")).toBeInTheDocument()
    expect(screen.queryByText("Débloqué")).toBeNull()
  })

  it("série : l'objectif et le reste à faire sont explicites", () => {
    render(
      <BadgeDetail
        family="SERIES"
        badge={badge({
          code: "SERIES_BRONZE",
          label: "En série",
          metric: "WIN_STREAK",
          target: 4,
          progress: 3,
        })}
      />
    )

    expect(
      screen.getByText("Enchaîne 4 victoire(s) d'affilée")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Encore 1 victoire(s) d'affilée")
    ).toBeInTheDocument()
    expect(screen.getByText("3 sur 4")).toBeInTheDocument()
  })
})
