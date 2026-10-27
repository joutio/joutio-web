import { describe, expect, it } from "vitest"
import { shareTargets } from "./share"

const URL = "https://app.joutio.test/topics/topic-1"

describe("shareTargets", () => {
  it("construit les intents des quatre réseaux avec l'URL encodée", () => {
    const targets = shareTargets("Découvre ce thème !", URL)

    expect(targets.map((target) => target.id)).toEqual([
      "whatsapp",
      "x",
      "facebook",
      "telegram",
    ])
    for (const target of targets) {
      expect(target.href).toContain(encodeURIComponent(URL))
    }
  })

  it("ajoute le message sur WhatsApp, X et Telegram", () => {
    const targets = shareTargets("Découvre ce thème !", URL)
    const text = encodeURIComponent("Découvre ce thème !")

    expect(targets.find((target) => target.id === "whatsapp")?.href).toContain(
      text
    )
    expect(targets.find((target) => target.id === "x")?.href).toContain(text)
    expect(targets.find((target) => target.id === "telegram")?.href).toContain(
      text
    )
    expect(
      targets.find((target) => target.id === "facebook")?.href
    ).not.toContain(text)
  })
})
