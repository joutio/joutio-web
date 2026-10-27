import { beforeAll, describe, expect, it, vi } from "vitest"

const AUTHORITY = "http://localhost:8085"
const AUTHORIZE_URL = `${AUTHORITY}/oauth2/authorize?client_id=argocd&state=abc`

let continueUrl: typeof import("./continue-url")

function stubSessionStorage(): Map<string, string> {
  const store = new Map<string, string>()
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  })
  return store
}

beforeAll(async () => {
  // `config` lit `window.location.origin` à l'import : le stub précède l'import dynamique.
  vi.stubGlobal("window", { location: { origin: AUTHORITY, assign: vi.fn() } })
  continueUrl = await import("./continue-url")
})

describe("continueUrl", () => {
  it("accepte uniquement l'authorize de l'issuer OIDC", () => {
    expect(continueUrl.isAuthorizationContinueUrl(AUTHORIZE_URL)).toBe(true)
    expect(
      continueUrl.isAuthorizationContinueUrl(
        "https://evil.example/oauth2/authorize"
      )
    ).toBe(false)
    expect(
      continueUrl.isAuthorizationContinueUrl(`${AUTHORITY}/callback`)
    ).toBe(false)
    expect(continueUrl.isAuthorizationContinueUrl("pas-une-url")).toBe(false)
  })

  it("mémorise puis consomme une cible valide", () => {
    stubSessionStorage()
    const assign = vi.fn()
    vi.stubGlobal("window", { location: { assign } })

    continueUrl.rememberContinue(AUTHORIZE_URL)
    expect(continueUrl.readContinue()).toBe(AUTHORIZE_URL)

    expect(continueUrl.resumeContinue()).toBe(true)
    expect(assign).toHaveBeenCalledWith(AUTHORIZE_URL)
    expect(continueUrl.readContinue()).toBeNull()
  })

  it("ignore une cible non autorisée", () => {
    stubSessionStorage()

    continueUrl.rememberContinue("https://evil.example/oauth2/authorize")
    expect(continueUrl.readContinue()).toBeNull()

    continueUrl.clearContinue()
    expect(continueUrl.readContinue()).toBeNull()
  })
})
