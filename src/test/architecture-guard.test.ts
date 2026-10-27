import { describe, expect, it } from "vitest"

/**
 * Garde-fou statique d'architecture (cf. best-practices/.frontend/folder-structure.md) : le
 * `domain/` d'une feature est un **contrat pur** (modèles + règles) — aucun React, aucune
 * infrastructure (`@/lib/*`), aucune couche interne de feature (la sienne ou celle d'une autre).
 * Il ne peut dépendre que des types partagés (`@/shared/*`), du `domain/` des autres features
 * (contrat) et de librairies neutres (`i18next`…).
 */
const SOURCES = import.meta.glob("../features/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

interface Rule {
  readonly name: string
  readonly pattern: RegExp
}

const RULES: Rule[] = [
  {
    name: "React (composant ou hook) — le domain reste framework-free",
    pattern: /from "react(-dom)?(\/[^"]*)?"/,
  },
  {
    name: "infrastructure @/lib/* (api-client, ws, session, i18n, query-keys…)",
    pattern: /from "@\/lib\//,
  },
  {
    name: "couche interne de la même feature (lib/hooks/components/application/…)",
    pattern:
      /from "\.\.\/(lib|hooks|components|application|stores|providers|pages)\//,
  },
  {
    name: "implémentation interne d'une autre feature (hors domain/ — contrat)",
    pattern:
      /from "@\/features\/[^"]+\/(lib|hooks|components|application|stores|providers|pages)\//,
  },
]

const DOMAIN_FILES = Object.entries(SOURCES).filter(
  ([file]) =>
    /\/features\/[^/]+\/domain\//.test(file) && !file.endsWith(".test.ts")
)

describe("contrat d'architecture — domain/", () => {
  it("des fichiers domain/ sont bien analysés", () => {
    expect(DOMAIN_FILES.length).toBeGreaterThan(0)
  })

  for (const rule of RULES) {
    it(`interdit : ${rule.name}`, () => {
      const offenders: string[] = []
      for (const [file, content] of DOMAIN_FILES) {
        content.split("\n").forEach((line, index) => {
          if (rule.pattern.test(line)) {
            offenders.push(`${file}:${index + 1} — ${line.trim()}`)
          }
        })
      }
      expect(offenders, `\n${offenders.join("\n")}`).toEqual([])
    })
  }
})
