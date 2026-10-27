import { describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { topicShareMessage } from "./share"

describe("topicShareMessage", () => {
  it("cite le thème", async () => {
    await i18n.changeLanguage("fr")
    expect(topicShareMessage(i18n.t.bind(i18n), "Cinéma")).toBe(
      "Découvre le thème « Cinéma » sur Joutio !"
    )
  })
})
