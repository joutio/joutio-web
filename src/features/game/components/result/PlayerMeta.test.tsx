// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { PlayerMeta } from "./PlayerMeta"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("PlayerMeta", () => {
  it("affiche l'Elo et le gain du duel sous le pseudo", () => {
    render(
      <PlayerMeta name="Alice" rating={842} ratingDelta={18} rated color="#fff" />
    )

    expect(screen.getByText(/Elo 842/)).toBeInTheDocument()
    expect(screen.getByText("+18")).toBeInTheDocument()
    expect(screen.queryByText(/Apprenti/)).toBeNull()
  })

  it("signale une perte d'Elo", () => {
    render(
      <PlayerMeta name="Bob" rating={1_204} ratingDelta={-12} rated color="#fff" />
    )

    expect(screen.getByText("-12")).toBeInTheDocument()
  })

  it("signale un duel non classé", () => {
    render(
      <PlayerMeta name="Bot" rating={200} ratingDelta={0} rated={false} color="#fff" />
    )

    expect(screen.getByText(/non classé/)).toBeInTheDocument()
  })
})
