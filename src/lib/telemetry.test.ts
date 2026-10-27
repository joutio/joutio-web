// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { reportClientError, trackProductEvent } from "./telemetry"

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true })
  vi.stubGlobal("fetch", fetchMock)
})

describe("telemetry", () => {
  it("envoie une erreur client au BFF sans identifiant utilisateur", async () => {
    reportClientError(new Error("boom"), {
      type: "REACT_RENDER",
      source: "ErrorBoundary",
    })
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain("/api/telemetry/client-errors")
    expect(init.method).toBe("POST")
    const body = JSON.parse(String(init.body))
    expect(body).toMatchObject({
      type: "REACT_RENDER",
      message: "boom",
      source: "ErrorBoundary",
    })
    expect(body).not.toHaveProperty("userId")
    expect(body.route).toBe(window.location.pathname)
  })

  it("déduplique une même erreur sur la fenêtre courte", async () => {
    reportClientError(new Error("dedupe-unique"), { type: "JS_ERROR" })
    reportClientError(new Error("dedupe-unique"), { type: "JS_ERROR" })
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("envoie un événement produit allowlisté", async () => {
    trackProductEvent("duel_start_requested", {
      mode: "public",
      first: "true",
    })
    await Promise.resolve()

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(String(init.body))).toEqual({
      name: "duel_start_requested",
      properties: { mode: "public", first: "true" },
    })
  })
})
