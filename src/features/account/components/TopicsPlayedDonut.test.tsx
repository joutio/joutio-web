// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Reveal neutralisé : l'état final est posé immédiatement (comme en prefers-reduced-motion).
vi.mock("framer-motion", () => ({
  useReducedMotion: () => true,
}))

import {
  buildTopicsPlayedChart,
  DONUT_CIRCUMFERENCE,
} from "../domain/topics-played-chart"
import { TopicsPlayedDonut } from "./TopicsPlayedDonut"

const CHART = buildTopicsPlayedChart(
  [
    { key: "a", label: "Space Exploration", value: 68, color: null },
    { key: "b", label: "Jokes", value: 27, color: null },
  ],
  { otherLabel: "Autres" }
)

describe("TopicsPlayedDonut", () => {
  it("rend les libellés, les compteurs et les leaders des parts", () => {
    const { container } = render(
      <TopicsPlayedDonut chart={CHART} ariaLabel="Sujets joués" />
    )

    expect(screen.getByText("Space Exploration")).toBeInTheDocument()
    expect(screen.getByText("68")).toBeInTheDocument()
    expect(container.querySelectorAll("svg line")).toHaveLength(
      CHART.segments.length
    )
    expect(container.querySelectorAll("svg text")).toHaveLength(
      CHART.segments.length
    )
    expect(container.querySelectorAll("circle[stroke-dasharray]")).toHaveLength(
      CHART.segments.length
    )
  })

  it("pose des arcs **complets** à l'état final du reveal", () => {
    const { container } = render(
      <TopicsPlayedDonut chart={CHART} ariaLabel="Sujets joués" />
    )

    const arc = container.querySelector("circle[stroke-dasharray]")
    const [first] = CHART.segments
    expect(arc?.getAttribute("stroke-dasharray")).toBe(
      `${first.arcLength} ${DONUT_CIRCUMFERENCE - first.arcLength}`
    )
  })

  it("boîte fluide : conteneur de requêtes et paliers tablette / desktop", () => {
    const { container } = render(
      <TopicsPlayedDonut chart={CHART} ariaLabel="Sujets joués" />
    )

    const box = container.querySelector('[role="img"]')
    expect(box?.className).toContain("@container")
    expect(box?.className).toContain("max-w-[32rem]")
    expect(box?.className).toContain("tablet:max-w-[36rem]")
    expect(box?.className).toContain("desktop:max-w-[44rem]")
  })
})
