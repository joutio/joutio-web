import { describe, expect, it } from "vitest"

/**
 * Garde-fou statique du contrat responsive (cf. best-practices/.frontend/responsive-sizing.md).
 * Échoue si un fichier réintroduit une taille arbitraire, un ancien breakpoint ou un accès
 * direct à `matchMedia` hors du hook device.
 */
const SOURCES = import.meta.glob("../../**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>

const IGNORED = ["/components/arc/", "/components/animate-ui/"]
/** `matchMedia` légitime hors contrat device : hover pointeur, thème système. */
const ALLOWED_MATCHMEDIA = [
  "/hooks/use-device.ts",
  "/shell/providers/ThemeProvider.tsx",
]

/** Hex légitimes : palettes de contenu, métaux, marques tierces, repères système. */
const ALLOWED_HEX = [
  "/avatar/",
  "/components/avatar-editor.tsx",
  "/components/joutio-mark.tsx",
  "/components/topic-icon.tsx",
  "/utils/categories.ts",
  "/utils/person-color.ts",
  "/utils/share.ts",
  "/account/domain/topics-played-chart.ts",
  "/account/components/TopicsPlayedDonut.tsx",
  "/auth/components/AuthField.tsx",
  "/game/components/Confetti.tsx",
  "/game/components/result/palette.ts",
  "/game/components/versus/VersusScreen.tsx",
  "/matchmaking/components/SearchingScreen.tsx",
  "/progression/domain/",
  "/shell/providers/ThemeProvider.tsx",
  "/topic-authoring/pages/CreateTopicPage.tsx",
]

interface Rule {
  readonly name: string
  readonly pattern: RegExp
  readonly isAllowed?: (file: string) => boolean
}

const RULES: Rule[] = [
  {
    name: "taille de texte arbitraire (text-[Npx]) — utiliser l'échelle Tailwind",
    pattern: /\btext-\[[0-9.]+(?:px|rem)\]/,
  },
  {
    name: "palette Tailwind directe — utiliser les jetons du design system",
    pattern:
      /\b(?:bg|text|border|ring)-(?:cyan|pink|rose|orange|yellow|blue|green|red|emerald|amber|violet|purple|indigo|sky|teal|lime|fuchsia)-\d{2,3}\b/,
  },
  {
    name: "couleur hex en dur — utiliser un jeton (design/tokens.json)",
    pattern: /["'`\s]#[0-9a-fA-F]{6}\b/,
    isAllowed: (file) =>
      file.includes(".test.") ||
      ALLOWED_HEX.some((path) => file.includes(path)),
  },
  {
    name: "ancien breakpoint Tailwind (max-sm/max-md/max-lg) — utiliser compact:/tablet:/touch:",
    pattern: /\bmax-(?:sm|md|lg):/,
  },
  {
    name: "100vh — utiliser svh/dvh",
    pattern: /\b100vh\b/,
  },
  {
    name: "hook legacy use-mobile — utiliser useDevice/useIsTouchLayout",
    pattern: /shared\/hooks\/use-mobile/,
  },
  {
    name: "matchMedia direct — passer par useDevice",
    pattern: /matchMedia\(/,
    isAllowed: (file) => ALLOWED_MATCHMEDIA.some((path) => file.endsWith(path)),
  },
]

const FILES = Object.entries(SOURCES)
  .filter(([file]) => !IGNORED.some((ignored) => file.includes(ignored)))
  .filter(([file]) => !file.endsWith(".test.ts"))

describe("contrat responsive", () => {
  for (const rule of RULES) {
    it(`interdit : ${rule.name}`, () => {
      const offenders: string[] = []
      for (const [file, content] of FILES) {
        if (rule.isAllowed?.(file)) continue
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
