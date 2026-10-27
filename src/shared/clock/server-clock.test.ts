import { afterEach, describe, expect, it, vi } from "vitest"
import { readServerNow, recordServerInstant } from "./server-clock"

describe("horloge serveur", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("rejoue un échantillon identique sans dériver (ré-ancrage idempotent)", () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000_000)

    const serverEpoch = 1_000_123
    const sampledAt = 1_000_000
    recordServerInstant(serverEpoch, sampledAt)
    expect(readServerNow()).toBe(serverEpoch)

    // 30 s plus tard, le même échantillon (cache React Query) est rejoué : l'offset ne change pas.
    vi.setSystemTime(sampledAt + 30_000)
    recordServerInstant(serverEpoch, sampledAt)
    expect(readServerNow() - Date.now()).toBe(serverEpoch - sampledAt)
    expect(readServerNow()).toBe(serverEpoch + 30_000)
  })
})

const SOURCES = import.meta.glob("./useServerClock.ts", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>
const SOURCE = Object.values(SOURCES)[0] ?? ""

describe("garde-fou statique useServerClock", () => {
  it("mesure l'horloge avec l'instant réel de la réponse (dataUpdatedAt)", () => {
    expect(SOURCE).toMatch(
      /recordServerInstant\(\s*data\.epochMillis\s*,\s*dataUpdatedAt\s*\)/
    )
    expect(SOURCE).not.toMatch(/recordServerInstant\(\s*data\.epochMillis\s*\)/)
  })

  it("re-mesure au montage de chaque écran à échéance", () => {
    expect(SOURCE).toMatch(/refetchOnMount:\s*"always"/)
  })
})
