// @vitest-environment jsdom
import { render } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { PresenceDot } from "./PresenceDot"

beforeAll(async () => {
  await i18n.changeLanguage("fr")
})

describe("PresenceDot", () => {
  it("passe au gris quand le joueur est hors ligne", () => {
    const { container } = render(<PresenceDot presence={null} />)
    const dot = container.firstElementChild as HTMLElement

    expect(dot).toHaveAttribute("aria-label", "Hors ligne")
    expect(dot.className).toContain("bg-muted-foreground")
  })

  it("reste vert quand le joueur est en ligne", () => {
    const { container } = render(
      <PresenceDot
        presence={{ userId: "u1", status: "ONLINE", lastSeenAt: null }}
      />
    )
    const dot = container.firstElementChild as HTMLElement

    expect(dot.className).toContain("bg-[var(--duel-correct-accent)]")
  })

  it("passe au jaune quand le compte est suspendu", () => {
    const { container } = render(
      <PresenceDot
        presence={{ userId: "u1", status: "ONLINE", lastSeenAt: null }}
        suspended
      />
    )
    const dot = container.firstElementChild as HTMLElement

    expect(dot.className).toContain("bg-[var(--duel-gauge)]")
  })
})
