// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { ResultActions } from "./ResultActions"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

const BASE_PROPS = {
  botGame: false,
  onReplayBot: vi.fn(),
  onChallengeRematch: vi.fn(),
  onNewOpponent: vi.fn(),
  rematchPending: false,
  rematchRefused: false,
}

describe("ResultActions", () => {
  it("rend le signalement comme une action jaune pleine largeur", () => {
    render(
      <ResultActions {...BASE_PROPS} reportable onReportOpponent={vi.fn()} />
    )

    const report = screen.getByRole("button", { name: "Signaler" })
    expect(report).toHaveClass("w-full")
    expect(report.getAttribute("style")).toContain("var(--duel-gauge)")
    expect(report).toBeEnabled()
  })

  it("grise la revanche quand un défi est déjà en cours sur le thème", () => {
    render(<ResultActions {...BASE_PROPS} rematchBlocked />)

    const rematch = screen.getByRole("button", {
      name: "Défi en cours sur ce thème",
    })
    expect(rematch).toBeDisabled()
  })

  it("grise la revanche quand l'adversaire a supprimé son compte", () => {
    render(<ResultActions {...BASE_PROPS} rematchUnavailable />)

    const rematch = screen.getByRole("button", {
      name: "Adversaire supprimé",
    })
    expect(rematch).toBeDisabled()
  })

  it("affiche le compte à rebours de la revanche en attente", () => {
    render(
      <ResultActions
        {...BASE_PROPS}
        rematchPending
        rematchRemainingSeconds={4}
      />
    )

    const rematch = screen.getByRole("button", { name: "En attente · 4 s" })
    expect(rematch).toBeDisabled()
  })

  it("désactive le signalement une fois le joueur signalé", () => {
    render(
      <ResultActions
        {...BASE_PROPS}
        reportable
        reported
        onReportOpponent={vi.fn()}
      />
    )

    expect(screen.getByRole("button", { name: "Signalé" })).toBeDisabled()
  })
})
