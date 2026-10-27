import { describe, expect, it } from "vitest"
import { en } from "./locales/en"
import { fr } from "./locales/fr"

/** Chemins de clés pointés (`common.app.loading`). */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix]
  }
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("catalogues i18n", () => {
  it("fr et en exposent exactement les mêmes clés", () => {
    expect(keyPaths(en).sort()).toEqual(keyPaths(fr).sort())
  })

  it("chaque clé porte une traduction non vide (feuille string)", () => {
    for (const [language, catalog] of Object.entries({ fr, en })) {
      for (const path of keyPaths(catalog)) {
        const value = path
          .split(".")
          .reduce<unknown>(
            (node, key) => (node as Record<string, unknown>)[key],
            catalog
          )
        expect(typeof value, `${language}:${path}`).toBe("string")
        expect((value as string).trim(), `${language}:${path}`).not.toBe("")
      }
    }
  })
})
