import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

/**
 * Setup Vitest commun : matchers DOM (`@testing-library/jest-dom`) + nettoyage du rendu entre
 * les tests. Les tests de composants déclarent `// @vitest-environment jsdom` en tête de fichier
 * (par défaut : `node`, pour les tests purs de domain/lib).
 */

afterEach(() => {
  cleanup()
})

/** jsdom n'implémente pas `matchMedia` : stub neutre (aucune requête ne matche → « tablette »). */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList
}

/**
 * jsdom n'implémente ni `ResizeObserver` ni `IntersectionObserver` : stubs neutres (les
 * composants qui les utilisent — onglets beui, countdown Arc, motion — tolèrent une
 * observation sans rappel).
 */
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  class IntersectionObserverStub {
    root = null
    rootMargin = "0px"
    thresholds = [0]
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  globalThis.IntersectionObserver =
    IntersectionObserverStub as unknown as typeof IntersectionObserver
}
