import { afterEach, describe, expect, it, vi } from "vitest"
import { createApiClient } from "./api-client"

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function authHeader(init: RequestInit | undefined): string | undefined {
  return (init?.headers as Record<string, string> | undefined)?.Authorization
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("createApiClient — refresh sur 401", () => {
  it("renouvelle la session puis rejoue la requête avec le nouveau token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
    vi.stubGlobal("fetch", fetchMock)

    const onUnauthorized = vi.fn().mockResolvedValue("new-token")
    const client = createApiClient({
      baseUrl: "http://api.test",
      getAuthToken: () => "old-token",
      onUnauthorized,
      onError: vi.fn(),
    })

    await expect(client.get<{ ok: boolean }>("/x")).resolves.toEqual({
      ok: true,
    })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(authHeader(fetchMock.mock.calls[0][1])).toBe("Bearer old-token")
    expect(authHeader(fetchMock.mock.calls[1][1])).toBe("Bearer new-token")
  })

  it("échoue et publie l'erreur si le refresh ne renvoie pas de token", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "expired" }))
    vi.stubGlobal("fetch", fetchMock)

    const onError = vi.fn()
    const client = createApiClient({
      baseUrl: "http://api.test",
      getAuthToken: () => "old-token",
      onUnauthorized: vi.fn().mockResolvedValue(null),
      onError,
    })

    await expect(client.get("/x")).rejects.toMatchObject({ statusCode: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it("ne tente pas de refresh quand skipAuthRefresh est posé", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "bad code" }))
    vi.stubGlobal("fetch", fetchMock)

    const onUnauthorized = vi.fn().mockResolvedValue("new-token")
    const client = createApiClient({
      baseUrl: "http://api.test",
      getAuthToken: () => "old-token",
      onUnauthorized,
      onError: vi.fn(),
    })

    await expect(
      client.post("/auth", {}, { skipAuthRefresh: true, skipErrorBus: true })
    ).rejects.toMatchObject({ statusCode: 401 })
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("n'appelle onError pour les erreurs couvertes par skipErrorBus", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { message: "bad code" }))
    vi.stubGlobal("fetch", fetchMock)

    const onError = vi.fn()
    const client = createApiClient({
      baseUrl: "http://api.test",
      onError,
    })

    await expect(
      client.post("/auth", {}, { skipAuthRefresh: true, skipErrorBus: true })
    ).rejects.toMatchObject({ statusCode: 401 })
    expect(onError).not.toHaveBeenCalled()
  })
})
