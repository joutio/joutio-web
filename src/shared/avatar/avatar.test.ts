import { describe, expect, it } from "vitest"
import {
  avatarDataUri,
  defaultAvatarOptions,
  parseAvatarOptions,
  randomAvatarOptions,
  seedAvatarOptions,
} from "./avatar"
import { getAvatarStyle, type AvatarStyleId } from "./styles"

const STYLE_IDS: AvatarStyleId[] = ["micah"]
const SEEDS = ["user-1", "user-42", "player-xyz"]

function svgOf(uri: string): string {
  return decodeURIComponent(uri.slice(uri.indexOf(",") + 1))
}

function normalizeRadius(svg: string): string {
  return svg.replace(/rx="180" ry="180"/g, 'rx="0" ry="0"')
}

describe("avatar", () => {
  it("génère un data URI déterministe pour un même seed", () => {
    expect(avatarDataUri(undefined, 64, "user-1")).toBe(
      avatarDataUri(undefined, 64, "user-1")
    )
  })

  it("produit un avatar différent selon le seed", () => {
    expect(avatarDataUri(undefined, 64, "user-1")).not.toBe(
      avatarDataUri(undefined, 64, "user-2")
    )
  })

  it("defaultAvatarOptions est déterministe", () => {
    expect(defaultAvatarOptions("user-1")).toEqual(
      defaultAvatarOptions("user-1")
    )
  })

  it("randomAvatarOptions produit une config complète pour chaque style", () => {
    for (const styleId of STYLE_IDS) {
      const style = getAvatarStyle(styleId)
      const options = randomAvatarOptions(styleId)
      if (styleId !== "micah") expect(options.style).toBe(styleId)
      for (const field of style.variantFields) {
        if (!style.variants[field]?.length) continue
        expect(options[field], `${styleId}.${field}`).toBeTruthy()
      }
    }
  })

  it("parseAvatarOptions tolère l'absence, le contenu invalide et les styles inactifs", () => {
    expect(parseAvatarOptions(undefined)).toBeUndefined()
    expect(parseAvatarOptions(null)).toBeUndefined()
    expect(parseAvatarOptions("not json")).toBeUndefined()
    expect(parseAvatarOptions('{"hair":"full"}')).toEqual({ hair: "full" })
    expect(parseAvatarOptions('{"style":"nope","hair":"full"}')).toEqual({
      hair: "full",
    })
    expect(
      parseAvatarOptions('{"style":"lorelei","hair":"variant01"}')
    ).toEqual({
      style: "lorelei",
      hair: "variant01",
    })
    expect(parseAvatarOptions('{"style":"micah","hair":"variant01"}')).toEqual({
      style: "micah",
      hair: "variant01",
    })
  })

  it("rend un SVG pour une config complète", () => {
    const uri = avatarDataUri(defaultAvatarOptions("user-1"), 64, "user-1")
    expect(uri.startsWith("data:image/svg+xml")).toBe(true)
  })

  it("seedAvatarOptions est déterministe pour chaque style", () => {
    for (const styleId of STYLE_IDS) {
      expect(seedAvatarOptions("user-1", styleId)).toEqual(
        seedAvatarOptions("user-1", styleId)
      )
    }
  })

  it("seedAvatarOptions reproduit l'avatar dérivé du seed, pour chaque style", () => {
    for (const styleId of STYLE_IDS) {
      for (const seed of SEEDS) {
        const withOptions = normalizeRadius(
          svgOf(avatarDataUri(seedAvatarOptions(seed, styleId), 64, seed))
        )
        const seedDerived = normalizeRadius(
          svgOf(avatarDataUri({ style: styleId }, 64, seed))
        )
        expect(withOptions, `${styleId}:${seed}`).toBe(seedDerived)
      }
    }
  })

  it("seedAvatarOptions (micah) reproduit l'avatar sans options persistées", () => {
    for (const seed of SEEDS) {
      const withOptions = normalizeRadius(
        svgOf(avatarDataUri(seedAvatarOptions(seed), 64, seed))
      )
      const seedDerived = normalizeRadius(
        svgOf(avatarDataUri(undefined, 64, seed))
      )
      expect(withOptions).toBe(seedDerived)
    }
  })

  it("le registry correspond aux définitions DiceBear", () => {
    for (const styleId of STYLE_IDS) {
      const style = getAvatarStyle(styleId)
      const raw = style.definition as {
        components?: Record<string, { variants?: Record<string, unknown> }>
        colors?: Record<string, unknown>
      }
      for (const field of style.variantFields) {
        const component = raw.components?.[field]
        expect(component, `${styleId}.${field}`).toBeTruthy()
        for (const variant of style.variants[field] ?? []) {
          expect(
            Object.keys(component?.variants ?? {}),
            `${styleId}.${field}.${variant}`
          ).toContain(variant)
        }
      }
      for (const field of style.colorFields) {
        if (field === "backgroundColor") continue
        expect(Object.keys(raw.colors ?? {}), `${styleId}.${field}`).toContain(
          field.replace(/Color$/, "")
        )
      }
    }
  })
})
