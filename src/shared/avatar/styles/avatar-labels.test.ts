import { beforeAll, describe, expect, it } from "vitest"
import i18n from "@/lib/i18n"
import {
  getAvatarStyle,
  loadAllAvatarStyles,
  type AvatarStyleId,
} from "@/shared/avatar/styles"

/** Styles dont les variantes doivent être libellées (les styles Premium Lorelei/Notionists). */
const DESCRIBED_STYLES: AvatarStyleId[] = ["lorelei", "notionists"]

beforeAll(async () => {
  await i18n.changeLanguage("fr")
  await loadAllAvatarStyles()
})

describe("libellés des variantes Lorelei/Notionists", () => {
  for (const styleId of DESCRIBED_STYLES) {
    it(`${styleId} : chaque variante a un libellé descriptif en FR et EN`, () => {
      const style = getAvatarStyle(styleId)
      const tFr = i18n.getFixedT("fr")
      const tEn = i18n.getFixedT("en")

      for (const group of style.groups) {
        for (const section of group.sections) {
          const variants = section.variants ?? []
          if (!section.variantField || variants.length === 0) continue

          const seen = {
            fr: new Set<string>(),
            en: new Set<string>(),
          }
          for (const variant of variants) {
            const context = `${styleId}.${section.id}.${variant}`
            const key = section.labelKeys?.[variant]
            expect(key, `libellé manquant : ${context}`).toBeTruthy()
            if (!key) continue

            for (const [lang, t] of [
              ["fr", tFr],
              ["en", tEn],
            ] as const) {
              const label = t(key)
              expect(label, `${lang} : ${key}`).not.toBe(key)
              expect(label, `${lang} : ${key}`).not.toMatch(
                /^(Variante|Variant)\b/
              )
              expect(label.trim().length, `${lang} : ${key}`).toBeGreaterThan(0)
              expect(
                seen[lang].has(label),
                `libellé dupliqué dans ${styleId}.${section.id} (${lang}) : « ${label} »`
              ).toBe(false)
              seen[lang].add(label)
            }
          }
        }
      }
    })
  }
})
