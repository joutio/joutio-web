// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"

vi.mock("../../hooks/useReportQuestion", () => ({
  useReportQuestion: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/shared/hooks/use-device", () => ({
  useIsTouchLayout: () => true,
}))

import { ReportQuestionDialog } from "./ReportQuestionDialog"

describe("ReportQuestionDialog (tactile)", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("fr")
  })

  it("rend le formulaire dans une bottom sheet Arc", () => {
    render(
      <ReportQuestionDialog
        open
        onClose={vi.fn()}
        gameId="game-1"
        questionId="question-1"
        questionText="Quelle est la capitale de la France ?"
        language="fr"
        onReported={vi.fn()}
      />
    )

    expect(
      screen.getByRole("dialog", { name: "Signaler cette question" })
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: /Expand sheet|Collapse sheet/ })
    ).toBeTruthy()
    expect(
      screen.getByRole("button", { name: /Envoyer le signalement/ })
    ).toBeTruthy()
  })
})
