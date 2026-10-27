// @vitest-environment jsdom
import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AnimatedNumber } from "./animated-number"

/** Avance horloge factice (Date + `performance`) et timers d'un même pas. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe("AnimatedNumber", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "Date",
        "performance",
        "requestAnimationFrame",
        "cancelAnimationFrame",
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("part de la valeur courante et monte à la cible en progression linéaire", () => {
    const { rerender, container } = render(
      <AnimatedNumber value={0} duration={900} />
    )
    expect(container.textContent).toBe("0")

    rerender(<AnimatedNumber value={100} duration={900} />)

    // Quart de la durée : un quart de la montée (≈ 25).
    advance(225)
    expect(Number(container.textContent)).toBeCloseTo(25, -1)

    // Trois quarts : trois quarts de la montée (≈ 75).
    advance(450)
    expect(Number(container.textContent)).toBeCloseTo(75, -1)

    // Fin : la cible est atteinte et tenue.
    advance(300)
    expect(container.textContent).toBe("100")
    advance(1_000)
    expect(container.textContent).toBe("100")
  })

  it("repart de la valeur affichée quand la cible change en cours d'animation", () => {
    const { rerender, container } = render(
      <AnimatedNumber value={0} duration={900} />
    )
    rerender(<AnimatedNumber value={100} duration={900} />)
    advance(450)
    const mid = Number(container.textContent)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(100)

    // Retour à 0 en plein vol : la descente repart de la valeur affichée.
    rerender(<AnimatedNumber value={0} duration={900} />)
    advance(1_000)
    expect(container.textContent).toBe("0")
  })

  it("pose la valeur immédiatement quand la durée est nulle", () => {
    const { container } = render(<AnimatedNumber value={42} duration={0} />)
    expect(container.textContent).toBe("42")
  })
})
