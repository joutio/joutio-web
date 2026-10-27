// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { SectionHeader } from "./section-header"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("SectionHeader", () => {
  it("garde l'action visible en compact avec un libellé réduit", () => {
    render(
      <SectionHeader
        title="Top 10 du moment"
        actionLabel="Explorer le catalogue"
        compactActionLabel="Catalogue"
        onAction={vi.fn()}
      />
    )

    const action = screen.getByRole("button", {
      name: "Explorer le catalogue",
    })
    expect(action.parentElement).not.toHaveClass("compact:hidden")
    expect(screen.getByText("Catalogue")).toHaveClass(
      "hidden",
      "compact:inline"
    )
    expect(screen.getByText("Explorer le catalogue")).toHaveClass(
      "compact:hidden"
    )
  })
})
