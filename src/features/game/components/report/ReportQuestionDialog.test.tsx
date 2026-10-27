// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"

const { mutate } = vi.hoisted(() => ({ mutate: vi.fn() }))

vi.mock("../../hooks/useReportQuestion", () => ({
  useReportQuestion: () => ({ mutate, isPending: false }),
}))

import { ReportQuestionDialog } from "./ReportQuestionDialog"

describe("ReportQuestionDialog", () => {
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
      <ReportQuestionDialog
        open
        onClose={onClose}
        gameId="game-1"
        questionId="question-1"
        questionText="Quelle est la capitale de la France ?"
        language="fr"
        onReported={onReported}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /L'image/ }))
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "L'image ne correspond pas." },
    })
    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/ })
    )

    expect(mutate).toHaveBeenCalledTimes(1)
    const [variables] = mutate.mock.calls[0]
    expect(variables.questionId).toBe("question-1")
    expect(variables.input.gameId).toBe("game-1")
    expect(variables.input.reasons).toEqual(["IMAGE"])
    expect(variables.input.comment).toBe("L'image ne correspond pas.")
    expect(onReported).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it("met en évidence les motifs sélectionnés et permet d'en choisir plusieurs", () => {
    render(
      <ReportQuestionDialog
        open
        onClose={vi.fn()}
        gameId="game-1"
        questionId="question-1"
        questionText="Question"
        onReported={vi.fn()}
      />
    )

    const image = screen.getByRole("button", { name: /L'image/ })
    const answers = screen.getByRole("button", { name: /Les réponses/ })

    expect(image).toHaveAttribute("aria-pressed", "false")
    expect(image).not.toHaveClass("border-primary")

    fireEvent.click(image)
    fireEvent.click(answers)

    expect(image).toHaveAttribute("aria-pressed", "true")
    expect(image).toHaveClass("border-primary")
    expect(answers).toHaveAttribute("aria-pressed", "true")
    expect(answers).toHaveClass("border-primary")

    fireEvent.click(image)

    expect(image).toHaveAttribute("aria-pressed", "false")
    expect(image).not.toHaveClass("border-primary")
    expect(answers).toHaveAttribute("aria-pressed", "true")
  })

  it("refuse un signalement sans motif", () => {
    render(
      <ReportQuestionDialog
        open
        onClose={vi.fn()}
        gameId="game-1"
        questionId="question-1"
        questionText="Question"
        onReported={vi.fn()}
      />
    )

    fireEvent.click(
      screen.getByRole("button", { name: /Envoyer le signalement/ })
    )

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByText("Choisis au moins un motif.")).toBeTruthy()
  })
})
