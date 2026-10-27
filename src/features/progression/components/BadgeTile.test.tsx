// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import type { BadgeItem } from "../domain/progression"
import { BadgeTile } from "./BadgeTile"

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

describe("BadgeTile", () => {
  it("verrouillée : libellé seul, sans palier ni icône d'état ni progression", () => {
    const { container } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ progress: 7 })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByText("Duelliste")).toBeInTheDocument()
    // Le palier et l'état ne sont plus écrits dans la tuile : le métal du sceau et le vert de la
    // carte portent l'information.
    expect(screen.queryByText("Bronze")).toBeNull()
    expect(screen.queryByLabelText("Verrouillé")).toBeNull()
    expect(screen.queryByLabelText("Débloqué")).toBeNull()
    // La progression (compteur, pourcentage, barre) n'est plus dans la tuile.
    expect(screen.queryByText("7 sur 10")).toBeNull()
    expect(container.querySelector(".h-1")).toBeNull()
    // Aucune ombre : la tuile est un simple cadre plat.
    expect(container.querySelector("[class*='shadow']")).toBeNull()

    // Verrouillée : tuile atténuée et sceau estompé/désaturé, comme une récompense.
    const tile = container.querySelector("button")
    expect(tile?.className).toContain("opacity-80")
    const medallion = container.querySelector('[data-slot="badge-medallion"]')
    expect(medallion?.className).toContain("opacity-45")
    expect(medallion?.className).toContain("grayscale")
    // Plus de voile superposé : le traitement vit sur la tuile et le sceau.
    expect(
      container.querySelector('[data-slot="badge-lock-overlay"]')
    ).toBeNull()
  })

  it("acquise : bordure et fond verts, sans coche ni palier", () => {
    const { container } = render(
      <BadgeTile
        family="VOLUME"
        badge={badge({ earned: true, progress: 10 })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.queryByLabelText("Débloqué")).toBeNull()
    expect(screen.queryByLabelText("Verrouillé")).toBeNull()
    expect(screen.queryByText("Bronze")).toBeNull()
    // Fond **plein** : vert mélangé à la surface de la carte, aucun fond à alpha.
    const tile = container.querySelector("button")
    expect(tile?.className).toContain(
      "bg-[color-mix(in_oklab,var(--success-600)_12%,var(--card))]"
    )
    expect(tile?.className).not.toMatch(/\bbg-[a-z0-9-]*\/\d/)
    // Aucune atténuation sur une carte acquise.
    expect(tile?.className).not.toContain("opacity-80")
    const medallion = container.querySelector('[data-slot="badge-medallion"]')
    expect(medallion?.className).not.toContain("opacity-")
    expect(medallion?.className).not.toContain("grayscale")
  })

  it("garde le palier et la progression dans l'aria-label", () => {
    render(
      <BadgeTile
        family="VICTORY"
        badge={badge({
          code: "WINNER_DIAMANT",
          tier: "DIAMANT",
          earned: true,
          progress: 50,
          target: 50,
        })}
        onOpen={vi.fn()}
      />
    )

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Légende absolue — Diamant — 50/50"
    )
  })

  it("ouvre la fiche au clic", async () => {
    const onOpen = vi.fn()
    const item = badge({ progress: 7 })
    render(<BadgeTile family="VOLUME" badge={item} onOpen={onOpen} />)

    await userEvent.click(screen.getByRole("button"))

    expect(onOpen).toHaveBeenCalledWith(item)
  })

  it("inerte sans `onOpen` (aperçu) : aucune cible interactive", () => {
    render(<BadgeTile family="VOLUME" badge={badge()} />)

    expect(screen.queryByRole("button")).toBeNull()
  })

  it("traduit le code connu et retombe sur le libellé du serveur sinon", () => {
    const { unmount } = render(
      <BadgeTile
        family="EXPLOIT"
        badge={badge({ code: "FIRST_WIN", label: "Première victoire" })}
      />
    )
    expect(screen.getByText("Première victoire")).toBeInTheDocument()
    unmount()

    render(
      <BadgeTile
        family="COLLECTION"
        badge={badge({ code: "NEXT_SEASON_HERO", label: "Héros" })}
      />
    )
    expect(screen.getByText("Héros")).toBeInTheDocument()
  })
})
