// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock("../hooks/useReportUser", () => ({
  useReportUser: () => ({ mutate, isPending: false }),
}))

import { ReportUserDialog } from "./ReportUserDialog"

describe("ReportUserDialog", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("fr")
    mutate.mockReset()
  })

  it("envoie les motifs et le commentaire puis ferme le dialogue", () => {
    const onReported = vi.fn()
    const onClose = vi.fn()
    mutate.mockImplementation((_variables, options) => {
      options?.onSuccess?.()
    })

    render(
      <ReportUserDialog
        open
        onClose={onClose}
        targetUserId="user-2"
        targetPseudonym="Bravo"
        gameId="game-1"
        onReported={onReported}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Harcèlement/ }))
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Insultes répétées." },
    })
    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/ })
    )

    expect(mutate).toHaveBeenCalledTimes(1)
    const [variables] = mutate.mock.calls[0]
    expect(variables.userId).toBe("user-2")
    expect(variables.input.gameId).toBe("game-1")
    expect(variables.input.reasons).toEqual(["HARASSMENT"])
    expect(variables.input.comment).toBe("Insultes répétées.")
    expect(onReported).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("met en évidence les motifs sélectionnés et permet d'en choisir plusieurs", () => {
    render(
      <ReportUserDialog
        open
        onClose={vi.fn()}
        targetUserId="user-2"
        targetPseudonym="Bravo"
      />
    )

    const harassment = screen.getByRole("button", { name: /Harcèlement/ })
    const cheating = screen.getByRole("button", { name: /Triche/ })

    expect(harassment).toHaveAttribute("aria-pressed", "false")
    expect(harassment).not.toHaveClass("border-primary")

    fireEvent.click(harassment)
    fireEvent.click(cheating)

    expect(harassment).toHaveAttribute("aria-pressed", "true")
    expect(harassment).toHaveClass("border-primary")
    expect(cheating).toHaveAttribute("aria-pressed", "true")
    expect(cheating).toHaveClass("border-primary")

    fireEvent.click(harassment)

    expect(harassment).toHaveAttribute("aria-pressed", "false")
    expect(harassment).not.toHaveClass("border-primary")
    expect(cheating).toHaveAttribute("aria-pressed", "true")
  })

  it("refuse un signalement sans motif", () => {
    render(
      <ReportUserDialog
        open
        onClose={vi.fn()}
        targetUserId="user-2"
        targetPseudonym="Bravo"
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/ })
    )

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText("Choisis au moins un motif.")).toBeTruthy()
  })
})
