// @vitest-environment jsdom
import type { RefObject } from "react"
import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import { useScrollHeader } from "./useScrollHeader"
import { useScrollRestoration } from "./useScrollRestoration"

/**
 * jsdom ne fait aucune mise en page : on pilote les métriques du conteneur à la main
 * (`scrollTop`, `scrollHeight`, `clientHeight`) pour rejouer un vrai cycle
 * « geste → frame → remise en page du navigateur ».
 */
interface FakeScrollElement {
  element: HTMLDivElement
  ref: RefObject<HTMLDivElement | null>
  scrollTo: (top: number, scrollHeight?: number) => void
}

function fakeScrollElement(): FakeScrollElement {
  const element = document.createElement("div")
  document.body.appendChild(element)
  let top = 0
  let scrollHeight = 2000
  const clientHeight = 600

  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      top = value
    },
  })
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  })
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  })

  return {
    element,
    ref: { current: element },
    /** Simule un échantillon du navigateur puis l'événement `scroll` qu'il émet. */
    scrollTo: (nextTop: number, nextScrollHeight = scrollHeight) => {
      top = nextTop
      scrollHeight = nextScrollHeight
      element.dispatchEvent(new Event("scroll"))
    },
  }
}

interface HarnessProps {
  scroll: FakeScrollElement
  onRestored?: () => void
}

/** Câblage identique à `AppShell` : un recalage de scroll recale l'en-tête, qui repart visible. */
function Harness({ scroll, onRestored }: HarnessProps) {
  const [hidden, setHidden] = useState(false)
  const { reset } = useScrollHeader(scroll.ref, {
    onHiddenChange: setHidden,
  })
  useScrollRestoration({
    containerRef: scroll.ref,
    onRestored: () => {
      onRestored?.()
      reset()
    },
  })
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  return (
    <div>
      <span data-testid="path">{`${pathname}${search}`}</span>
      <span data-testid="chrome">{hidden ? "masqué" : "visible"}</span>
      <button type="button" onClick={() => void navigate("/b")}>
        ouvrir
      </button>
      <button type="button" onClick={() => void navigate("/a?tab=x")}>
        onglet
      </button>
      <button type="button" onClick={() => void navigate(-1)}>
        retour
      </button>
    </div>
  )
}

function renderHarness(initialEntry: string, onRestored?: () => void) {
  const scroll = fakeScrollElement()
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Harness scroll={scroll} onRestored={onRestored} />
    </MemoryRouter>
  )
  return scroll
}

/** Laisse la frame du hook se poser (les mises à jour passent par `requestAnimationFrame`). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

describe("useScrollRestoration", () => {
  it("ouvre la nouvelle route avec le chrome recalé visible (pas d'impasse du masquage)", async () => {
    const onRestored = vi.fn()
    const scroll = renderHarness("/a", onRestored)

    // Geste : l'utilisateur descend, le chrome se masque (comportement natif compact).
    scroll.scrollTo(1200)
    await waitFor(() =>
      expect(screen.getByTestId("chrome").textContent).toBe("masqué")
    )
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)

    fireEvent.click(screen.getByRole("button", { name: "ouvrir" }))
    await waitFor(() =>
      expect(screen.getByTestId("path").textContent).toBe("/b")
    )

    // Nouvelle page = haut de page + en-tête recalé : jamais masqué par le scroll précédent.
    expect(scroll.element.scrollTop).toBe(0)
    expect(onRestored).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("chrome").textContent).toBe("visible")
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(false)

    // Le `scroll` de rognage émis par le navigateur sur la nouvelle page (hauteur différente)
    // est classé `isRelayout` : il ne doit pas re-basculer l'état.
    scroll.scrollTo(0, 900)
    await settle()
    expect(screen.getByTestId("chrome").textContent).toBe("visible")
  })

  it("ne recale rien sur un changement de query seule (clic d'onglet)", async () => {
    const onRestored = vi.fn()
    const scroll = renderHarness("/a", onRestored)

    scroll.scrollTo(1200)
    await waitFor(() =>
      expect(screen.getByTestId("chrome").textContent).toBe("masqué")
    )

    fireEvent.click(screen.getByRole("button", { name: "onglet" }))
    await waitFor(() =>
      expect(screen.getByTestId("path").textContent).toBe("/a?tab=x")
    )

    // Position conservée, chrome inchangé, aucun recalage : strictement geste-driven.
    expect(scroll.element.scrollTop).toBe(1200)
    expect(screen.getByTestId("chrome").textContent).toBe("masqué")
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)
    expect(onRestored).not.toHaveBeenCalled()
  })

  it("restaure la position mémorisée et recale l'en-tête au retour", async () => {
    const onRestored = vi.fn()
    const scroll = renderHarness("/a", onRestored)

    scroll.scrollTo(800)
    await waitFor(() =>
      expect(screen.getByTestId("chrome").textContent).toBe("masqué")
    )

    fireEvent.click(screen.getByRole("button", { name: "ouvrir" }))
    await waitFor(() =>
      expect(screen.getByTestId("path").textContent).toBe("/b")
    )

    fireEvent.click(screen.getByRole("button", { name: "retour" }))
    await waitFor(() =>
      expect(screen.getByTestId("path").textContent).toBe("/a")
    )

    await waitFor(() => expect(scroll.element.scrollTop).toBe(800))
    expect(onRestored).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId("chrome").textContent).toBe("visible")
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)
  })
})
