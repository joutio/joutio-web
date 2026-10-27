import { afterEach, describe, expect, it, vi } from "vitest"
import { preloadImage, preloadImages } from "./image-preload"

class FakeImage {
  static instances: FakeImage[] = []

  src = ""
  fetchPriority = "auto"
  decoding = "auto"

  constructor() {
    FakeImage.instances.push(this)
  }
}

afterEach(() => {
  FakeImage.instances = []
  vi.unstubAllGlobals()
})

describe("preloadImages", () => {
  it("déduplique, ignore les null et respecte la limite", () => {
    vi.stubGlobal("Image", FakeImage)

    preloadImages(["a.png", null, "b.png", "a.png", "c.png"], {
      limit: 2,
      priority: "low",
    })

    expect(FakeImage.instances.map((image) => image.src)).toEqual([
      "a.png",
      "b.png",
    ])
    expect(FakeImage.instances[0]?.fetchPriority).toBe("low")
    expect(FakeImage.instances[0]?.decoding).toBe("async")
  })

  it("ne recharge pas une URL déjà préchargée", () => {
    vi.stubGlobal("Image", FakeImage)

    preloadImage("https://example.com/unique-1.png")
    preloadImage("https://example.com/unique-1.png")

    expect(FakeImage.instances).toHaveLength(1)
  })
})
