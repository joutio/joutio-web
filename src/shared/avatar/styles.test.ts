import { describe, expect, it } from "vitest"
import { avatarDataUri } from "./avatar"
import {
  AVATAR_STYLE_IDS,
  getAvatarStyle,
  isActiveAvatarStyleId,
  getLoadedAvatarStyle,
  loadAllAvatarStyles,
  loadAvatarStyle,
} from "./styles"

/**
 * Contrat de **chargement à la demande** des styles DiceBear : seul le style par défaut
 * (micah) est embarqué au boot — les autres sont chargés par `loadAvatarStyle` (chunks
 * séparés). Un retour à des imports statiques ferait échouer le premier test.
 */
describe("styles d'avatar — chargement à la demande", () => {
  it("seul le style par défaut est chargé au boot", () => {
    expect(getLoadedAvatarStyle("micah")).toBeDefined()
    expect(getLoadedAvatarStyle(undefined)).toBeDefined()
    expect(getLoadedAvatarStyle("lorelei")).toBeUndefined()
    expect(getLoadedAvatarStyle("notionists")).toBeUndefined()
  })

  it("avatarDataUri lève pour un style non chargé (appelant fautif)", () => {
    expect(() => avatarDataUri({ style: "lorelei" }, 64, "seed")).toThrow(
      /lorelei/
    )
  })

  it("loadAvatarStyle charge puis mémoïse la définition", async () => {
    const definition = await loadAvatarStyle("lorelei")
    expect(definition.id).toBe("lorelei")
    expect(getLoadedAvatarStyle("lorelei")).toBe(definition)
    // Idempotent : la seconde résolution retourne la même définition.
    expect(await loadAvatarStyle("lorelei")).toBe(definition)
  })

  it("une fois chargé, le style rend un SVG comme les autres", () => {
    const uri = avatarDataUri({ style: "lorelei" }, 64, "seed")
    expect(uri.startsWith("data:image/svg+xml")).toBe(true)
  })

  it("loadAllAvatarStyles charge les styles actifs (éditeur)", async () => {
    expect(AVATAR_STYLE_IDS).toEqual(["micah", "lorelei", "notionists"])
    await loadAllAvatarStyles()
    expect(getLoadedAvatarStyle("micah")).toBeDefined()
    expect(getAvatarStyle("micah").id).toBe("micah")
  })

  it("seuls les styles actifs sont acceptés à l'écriture des options", () => {
    expect(isActiveAvatarStyleId("micah")).toBe(true)
    expect(isActiveAvatarStyleId("lorelei")).toBe(true)
    expect(isActiveAvatarStyleId("notionists")).toBe(true)
    expect(isActiveAvatarStyleId("inconnu")).toBe(false)
  })
})
