// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useScrollHeader } from "./useScrollHeader"
import type { RefObject } from "react"

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

/** Laisse la frame du hook se poser (les mises à jour passent par `requestAnimationFrame`). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

const isHidden = (scroll: FakeScrollElement) =>
  scroll.element.hasAttribute("data-chrome-hidden")

describe("useScrollHeader", () => {
  it("se cache en descendant puis se révèle en remontant", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(400)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))
    expect(scroll.element.hasAttribute("data-chrome-shifting")).toBe(true)

    scroll.scrollTo(120)
    await waitFor(() => expect(isHidden(scroll)).toBe(false))
  })

  it("ne re-masque pas la topbar juste après une révélation", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(1200)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))

    scroll.scrollTo(900)
    await waitFor(() => expect(isHidden(scroll)).toBe(false))

    // Rebond descendant immédiat : la grâce de révélation l'ignore.
    scroll.scrollTo(960)
    await settle()
    expect(isHidden(scroll)).toBe(false)

    // Après la grâce, un vrai geste descendant referme le chrome.
    await new Promise((resolve) => setTimeout(resolve, 320))
    scroll.scrollTo(1100)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))
  })

  it("ne re-rend pas l'hôte : l'état du chrome est impératif", async () => {
    const scroll = fakeScrollElement()
    let renders = 0
    renderHook(() => {
      renders += 1
      return useScrollHeader(scroll.ref)
    })

    expect(renders).toBe(1)

    scroll.scrollTo(400)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))
    expect(renders).toBe(1)

    scroll.scrollTo(120)
    await waitFor(() => expect(isHidden(scroll)).toBe(false))
    expect(renders).toBe(1)
  })

  it("notifie les bascules sans état React", async () => {
    const scroll = fakeScrollElement()
    const changes: boolean[] = []
    renderHook(() =>
      useScrollHeader(scroll.ref, {
        onHiddenChange: (hidden) => changes.push(hidden),
      })
    )

    scroll.scrollTo(400)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))
    scroll.scrollTo(120)
    await waitFor(() => expect(isHidden(scroll)).toBe(false))

    expect(changes).toContain(true)
    expect(changes.at(-1)).toBe(false)
  })

  it("ne bascule pas quand le contenu est remis en page (changement d'onglet)", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(1200)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))

    // Onglet plus court : Chrome rogne alors la position — mesuré à 0 sur une page qui défile
    // encore (204 px), la position exacte dépend de son ancrage de scroll. Aucun geste : l'état
    // de l'en-tête ne doit pas bouger.
    scroll.scrollTo(0, 700)
    await settle()
    expect(isHidden(scroll)).toBe(true)
    // Le verre, lui, suit la position réelle : plus rien sous la topbar, surface pleine.
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(false)

    // Onglet qui tient entièrement dans la fenêtre : rognage à zéro, toujours aucun geste.
    scroll.scrollTo(0, 600)
    await settle()
    expect(isHidden(scroll)).toBe(true)
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(false)

    // Le geste suivant recale l'état : une descente à peine entamée reste visible (haut de page).
    scroll.scrollTo(30)
    await waitFor(() => expect(isHidden(scroll)).toBe(false))
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)
  })

  it("active le verre dès que le contenu passe sous le chrome", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref))

    expect(scroll.element.hasAttribute("data-scrolled")).toBe(false)

    scroll.scrollTo(30)
    await waitFor(() =>
      expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)
    )

    scroll.scrollTo(0)
    await waitFor(() =>
      expect(scroll.element.hasAttribute("data-scrolled")).toBe(false)
    )
  })

  it("reste visible quand le repli est désactivé (desktop, écran dédié)", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref, { enabled: false }))

    scroll.scrollTo(800)
    await settle()

    expect(isHidden(scroll)).toBe(false)
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)
  })

  it("se cale sur la position restaurée au montage", () => {
    const scroll = fakeScrollElement()
    scroll.element.scrollTop = 400

    renderHook(() => useScrollHeader(scroll.ref))

    expect(scroll.element.hasAttribute("data-scrolled")).toBe(true)
  })

  it("recale le verre sur la position réelle lors d'un reset", async () => {
    const scroll = fakeScrollElement()
    const { result } = renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(400)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))

    // La navigation recale la position avant d'appeler `reset` (cf. `useScrollRestoration`).
    act(() => {
      scroll.element.scrollTop = 0
      result.current.reset()
    })

    expect(isHidden(scroll)).toBe(false)
    expect(scroll.element.hasAttribute("data-scrolled")).toBe(false)
  })

  it("garde le garde anti-liseré le temps de la transition", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(400)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))
    expect(scroll.element.hasAttribute("data-chrome-shifting")).toBe(true)

    await waitFor(
      () =>
        expect(scroll.element.hasAttribute("data-chrome-shifting")).toBe(false),
      { timeout: 1000 }
    )
  })

  it("reste piloté par le geste quand la hauteur ne bouge pas", async () => {
    const scroll = fakeScrollElement()
    renderHook(() => useScrollHeader(scroll.ref))

    scroll.scrollTo(1200)
    await waitFor(() => expect(isHidden(scroll)).toBe(true))

    scroll.scrollTo(600)
    await waitFor(() => expect(isHidden(scroll)).toBe(false))
  })
})
