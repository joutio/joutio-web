import { beforeAll, describe, expect, it } from "vitest"
import { avatarDataUri, toDicebearOptions } from "./avatar"
import {
  defaultOptionsFor,
  getAvatarStyle,
  loadAllAvatarStyles,
  type AvatarStyleId,
} from "./styles"

const STYLE_IDS: AvatarStyleId[] = ["lorelei", "notionists"]

function svgOf(uri: string): string {
  return decodeURIComponent(uri.slice(uri.indexOf(",") + 1))
}

beforeAll(async () => {
  await loadAllAvatarStyles()
})

describe("champs optionnels retirés", () => {
  it("Lorelei : « Aucun » cheveux conserve la tête (crâne rasé)", () => {
    const options = { ...defaultOptionsFor("lorelei"), hair: "none" }
    const dicebear = toDicebearOptions(options) as Record<string, unknown>

    expect(dicebear.hairVariant).toEqual(["variant01"])
    expect(dicebear.hairProbability).toBe(100)
    expect(dicebear.hairColor).toEqual(["#00000000"])
    expect(svgOf(avatarDataUri(options, 64))).toContain("<path")
  })

  it("Lorelei : « Aucun » cheveux laisse la barbe visible avec la couleur des cheveux", () => {
    const options = {
      ...defaultOptionsFor("lorelei"),
      hair: "none",
      beard: "variant01",
      hairColor: "#b45309",
    }
    const dicebear = toDicebearOptions(options) as Record<string, unknown>

    expect(dicebear.hairColor).toEqual(["#00000000"])
    expect(dicebear.beardColor).toEqual(["#b45309"])

    const svg = svgOf(avatarDataUri(options, 64))
    expect(svg).toContain('fill="#b45309"')
    expect(svg).toContain('fill="#00000000"')
  })

  it("Lorelei : la barbe suit la couleur des cheveux", () => {
    const options = { ...defaultOptionsFor("lorelei"), hairColor: "#b45309" }
    const dicebear = toDicebearOptions(options) as Record<string, unknown>

    expect(dicebear.beardColor).toEqual(["#b45309"])
  })

  it("Lorelei : la définition patchée donne à la barbe sa propre couleur", () => {
    const { definition } = getAvatarStyle("lorelei")
    const raw = definition as unknown as {
      components: {
        beard: { variants: Record<string, { elements: unknown[] }> }
      }
      colors: Record<string, unknown>
    }
    expect(raw.colors.beard).toBeDefined()

    const names: string[] = []
    const walk = (elements: unknown[]) => {
      for (const element of elements as Array<{
        attributes?: { fill?: { name?: string } }
        children?: unknown[]
      }>) {
        const name = element.attributes?.fill?.name
        if (name) names.push(name)
        if (element.children) walk(element.children)
      }
    }
    for (const variant of Object.values(raw.components.beard.variants)) {
      walk(variant.elements)
    }
    expect(names).toContain("beard")
    expect(names).not.toContain("hair")
  })

  it("retirer un champ optionnel ne vide jamais l'avatar", () => {
    for (const styleId of STYLE_IDS) {
      const style = getAvatarStyle(styleId)
      for (const field of style.optionalFields) {
        const options = { ...defaultOptionsFor(styleId), [field]: "none" }
        const svg = svgOf(avatarDataUri(options, 64))
        expect(svg, `${styleId}.${field}`).toContain("<path")
      }
    }
  })
})
