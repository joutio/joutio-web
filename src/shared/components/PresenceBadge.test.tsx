// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { PresenceBadge } from "./PresenceBadge"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("PresenceBadge", () => {
  it("affiche un point gris quand le joueur est hors ligne", () => {
    const { container } = render(<PresenceBadge online={false} />)

    expect(screen.getByText("Hors ligne")).toBeInTheDocument()
    expect(container.querySelector(".size-2")?.className).toContain(
      "bg-muted-foreground"
    )
  })

  it("garde le point vert quand le joueur est en ligne", () => {
    const { container } = render(<PresenceBadge online />)

    expect(screen.getByText("En ligne")).toBeInTheDocument()
    expect(container.querySelector(".size-2")?.className).toContain(
      "bg-[var(--duel-correct-accent)]"
    )
  })

  it("affiche un point jaune quand le compte est suspendu", () => {
    const { container } = render(<PresenceBadge online suspended />)

    expect(container.querySelector(".size-2")?.className).toContain(
      "bg-[var(--duel-gauge)]"
    )
  })
})
