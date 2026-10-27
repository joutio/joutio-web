import { describe, expect, it } from "vitest"
import { classifyRefreshFailure } from "./session-errors"

describe("classification des échecs de refresh", () => {
  it("classe les erreurs OAuth irrécupérables en définitif", () => {
    expect(classifyRefreshFailure({ error: "invalid_grant" })).toBe(
      "definitive"
    )
    expect(classifyRefreshFailure({ error: "invalid_token" })).toBe(
      "definitive"
    )
    expect(classifyRefreshFailure({ error: "invalid_client" })).toBe(
      "definitive"
    )
    expect(classifyRefreshFailure({ error: "unauthorized_client" })).toBe(
      "definitive"
    )
  })

  it("classe réseau, timeout et erreurs serveur en transitoire", () => {
    expect(
      classifyRefreshFailure(new TypeError("Network request failed"))
    ).toBe("transient")
    expect(classifyRefreshFailure(new Error("timeout"))).toBe("transient")
    expect(classifyRefreshFailure({ error: "server_error" })).toBe("transient")
    expect(classifyRefreshFailure({ error: "temporarily_unavailable" })).toBe(
      "transient"
    )
  })

  it("classe toute erreur inconnue en transitoire (ne jamais purger sur un doute)", () => {
    expect(classifyRefreshFailure(undefined)).toBe("transient")
    expect(classifyRefreshFailure(null)).toBe("transient")
    expect(classifyRefreshFailure("boom")).toBe("transient")
    expect(classifyRefreshFailure({})).toBe("transient")
  })
})
