// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import i18n from "@/lib/i18n"
import { SearchingScreen } from "./SearchingScreen"

vi.mock("@/shared/clock/useServerClock", () => ({
  useServerClock: () => ({ serverNow: () => Date.now() }),
}))

vi.mock("@/shared/hooks/useCountdownTicks", () => ({
  useCountdownTicks: () => undefined,
}))

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

describe("SearchingScreen", () => {
  it("affiche le statut « adversaire trouvé » quand la carte reçoit l'adversaire", async () => {
    await i18n.changeLanguage("fr")
    render(
      <SearchingScreen
        topic={{ name: "Histoire" }}
        found={{ name: "Idriss B.", country: "France" }}
      />
    )

    expect(screen.getByText("Adversaire trouvé")).toBeInTheDocument()
  })
})
