// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StreakCalendar } from "./streak-calendar"

describe("StreakCalendar", () => {
  it("marque en rouge les jours passés sans activité", () => {
    const referenceDate = new Date()
    referenceDate.setDate(referenceDate.getDate() - 7)

    render(
      <StreakCalendar
        view="week"
        streak={[]}
        referenceDate={referenceDate}
        locale="fr-FR"
        startOfWeek={1}
      />
    )

    const missed = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.getAttribute("aria-label")?.includes("jour manqué"))

    expect(missed).toBeDefined()
    expect(missed?.getAttribute("style")).toContain("--loss")
    expect(missed?.getAttribute("style")).toContain("80%")
    expect(missed?.getAttribute("style")).toContain("black")
    expect(missed?.className).toContain("text-white")
    expect(missed?.querySelector(".lucide-x")).not.toBeNull()
  })

  it("affiche les jours validés en vert avec une coche blanche", () => {
    const referenceDate = new Date()
    referenceDate.setDate(referenceDate.getDate() - 7)
    const key = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, "0")}-${String(referenceDate.getDate()).padStart(2, "0")}`

    render(
      <StreakCalendar
        view="week"
        streak={[{ periodStart: key, periodEnd: key }]}
        referenceDate={referenceDate}
        locale="fr-FR"
        startOfWeek={1}
      />
    )

    const active = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.getAttribute("aria-label")?.includes("série active"))

    expect(active?.getAttribute("style")).toContain("--success-600")
    expect(active?.getAttribute("style")).toContain("80%")
    expect(active?.getAttribute("style")).toContain("black")
    expect(active?.className).toContain("text-white")
    expect(active?.querySelector(".lucide-check")).not.toBeNull()
  })

  it("remplit aussi aujourd'hui et les jours futurs sans activité", () => {
    const today = new Date()
    const future = new Date(today)
    future.setDate(future.getDate() + 7)

    const { rerender } = render(
      <StreakCalendar view="week" streak={[]} locale="fr-FR" startOfWeek={1} />
    )

    const current = screen.getByRole("gridcell", { current: "date" })
    expect(current.className).toContain("bg-muted")
    expect(current.className).not.toContain("bg-muted/")

    rerender(
      <StreakCalendar
        view="week"
        streak={[]}
        referenceDate={future}
        locale="fr-FR"
        startOfWeek={1}
      />
    )

    const upcoming = screen
      .getAllByRole("gridcell")
      .find((cell) => cell.getAttribute("aria-label")?.includes("à venir"))
    expect(upcoming?.className).toContain("bg-muted")
    expect(upcoming?.className).not.toContain("bg-muted/")
  })
})
