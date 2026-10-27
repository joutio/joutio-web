// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { HorizontalRail } from "./horizontal-rail"

/** Device courant, piloté par chaque test (jsdom n'a pas de vrai `matchMedia`). */
const device = vi.hoisted(() => ({ touch: true }))
vi.mock("@/shared/hooks/use-device", () => ({
  useIsTouchLayout: () => device.touch,
}))

function renderRail() {
  return render(
    <HorizontalRail label="Sujets" viewportClassName="flex gap-4 pb-7">
      <div>carte</div>
    </HorizontalRail>
  )
}

describe("HorizontalRail", () => {
  it("rend un scroller natif full-bleed en compact/tablette", () => {
    device.touch = true
    renderRail()

    const rail = screen.getByRole("region", { name: "Sujets" })
    expect(rail).toHaveAttribute("data-native")
    expect(rail).toHaveAttribute("tabindex", "0")
    expect(rail).toHaveClass("overflow-x-auto")
    expect(rail).toHaveClass("qu-hide-scrollbar")
    // Full-bleed : la gouttière du PageContainer est annulée puis réintroduite en padding.
    expect(rail).toHaveClass("-mx-[var(--page-gutter-x)]")
    expect(rail).toHaveClass("w-[calc(100%+2*var(--page-gutter-x))]")
    expect(rail).toHaveClass("flex", "gap-4", "pb-7")
    expect(rail).not.toHaveAttribute("data-orientation")
    // Aucun chrome Arc : ni piste de barre, ni masque posé par le composant.
    expect(rail.querySelector("[data-axis]")).toBeNull()
    expect(screen.getByText("carte").parentElement).toBe(rail)
  })

  it("délègue à l'Arc ScrollArea en desktop", () => {
    device.touch = false
    renderRail()

    const viewport = screen.getByRole("region", { name: "Sujets" })
    const root = viewport.parentElement
    expect(root).toHaveAttribute("data-slot", "horizontal-rail")
    expect(root).toHaveAttribute("data-orientation", "horizontal")
    expect(root?.querySelector('[data-axis="x"]')).not.toBeNull()
    expect(viewport).toHaveClass("flex", "gap-4", "pb-7")
  })
})
