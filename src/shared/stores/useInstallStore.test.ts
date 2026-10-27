import { describe, expect, it, vi } from "vitest"
import {
  initInstallPromptCapture,
  useInstallStore,
  type BeforeInstallPromptEvent,
} from "./useInstallStore"

function fakeEvent(
  outcome: "accepted" | "dismissed"
): BeforeInstallPromptEvent {
  return {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
  } as unknown as BeforeInstallPromptEvent
}

describe("useInstallStore", () => {
  it("capture l'événement puis le consomme au prompt", async () => {
    const event = fakeEvent("accepted")
    useInstallStore.getState().capture(event)
    expect(useInstallStore.getState().deferred).toBe(event)

    await useInstallStore.getState().promptInstall()

    expect(event.prompt).toHaveBeenCalledOnce()
    expect(useInstallStore.getState().deferred).toBeNull()
  })

  it("marque l'app installée et purge l'événement en attente", () => {
    useInstallStore.getState().capture(fakeEvent("dismissed"))
    useInstallStore.getState().markInstalled()

    expect(useInstallStore.getState().installed).toBe(true)
    expect(useInstallStore.getState().deferred).toBeNull()
  })

  it("ne casse pas hors navigateur (init no-op en environnement node)", () => {
    expect(() => initInstallPromptCapture()).not.toThrow()
  })
})
