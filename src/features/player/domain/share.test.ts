import { describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import { profileShareMessage } from "./share"

describe("profileShareMessage", () => {
  it("cite le pseudonyme", async () => {
    await i18n.changeLanguage("fr")
    expect(profileShareMessage(i18n.t.bind(i18n), "Ada")).toBe(
      "Rejoins-moi sur Joutio et découvre mon profil « Ada » !"
    )
  })
})
