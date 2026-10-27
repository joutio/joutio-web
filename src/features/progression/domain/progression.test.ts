import { describe, expect, it } from "vitest"
import {
  BADGE_TIERS,
  badgeProgressPercent,
  countBadges,
  earnedBadges,
  equippedTitle,
  filterBadgeFamilies,
  filterTitles,
  isBadgeStateFilter,
  isTitleRankFilter,
  TIER_COLORS,
  TITLE_CARD_ACCENT,
  titleLabel,
  titleProgressPercent,
  type BadgeCollection,
  type BadgeFamilyGroup,
  type BadgeItem,
  type PlayerTitles,
  type UnlockedTitle,
} from "./progression"

function badge(overrides: Partial<BadgeItem> = {}): BadgeItem {
  return {
    code: "DUELIST_BRONZE",
    label: "Duelliste",
    tier: "BRONZE",
    metric: "HUMAN_DUELS",
    target: 10,
    earned: false,
    progress: 0,
    ...overrides,
  }
}

function title(overrides: Partial<UnlockedTitle> = {}): UnlockedTitle {
  return {
    key: "topic-1:OR",
    topicId: "topic-1",
    tier: "OR",
    tierProgressPercent: 40,
    tierRemainingXp: 1_400,
    nextTier: "PLATINE",
    topic: {
      topicId: "topic-1",
      names: { fr: "Histoire" },
      category: null,
      emoji: null,
      color: null,
      imageUrl: null,
      titles: null,
    },
    ...overrides,
  }
}

describe("badgeProgressPercent", () => {
  it("rapporte la progression à la cible", () => {
    expect(badgeProgressPercent(badge({ progress: 7, target: 10 }))).toBe(70)
  })

  it("plafonne à 100 et ignore une cible nulle", () => {
    expect(badgeProgressPercent(badge({ progress: 12, target: 10 }))).toBe(100)
    expect(badgeProgressPercent(badge({ progress: 3, target: 0 }))).toBe(0)
  })
})

describe("titleProgressPercent", () => {
  it("rapporte l'XP du sujet au seuil du palier", () => {
    expect(titleProgressPercent(1_200, 2_500)).toBe(48)
  })

  it("plafonne à 100 et ignore un seuil nul", () => {
    expect(titleProgressPercent(3_000, 2_500)).toBe(100)
    expect(titleProgressPercent(0, 0)).toBe(0)
  })
})

describe("equippedTitle", () => {
  it("résout le titre porté dans les titres débloqués", () => {
    const titles: PlayerTitles = {
      equippedKey: "topic-1:OR",
      titles: [title()],
    }

    expect(equippedTitle(titles)?.key).toBe("topic-1:OR")
  })

  it("résout un palier dépassé encore porté", () => {
    const titles: PlayerTitles = {
      equippedKey: "topic-1:FER",
      titles: [title({ key: "topic-1:FER", tier: "FER" }), title()],
    }

    expect(equippedTitle(titles)?.tier).toBe("FER")
  })

  it("rend null sans titre porté…", () => {
    expect(equippedTitle({ equippedKey: null, titles: [title()] })).toBeNull()
  })

  it("…ou si la clé portée n'est plus dans la liste", () => {
    expect(
      equippedTitle({ equippedKey: "topic-9:DIAMANT", titles: [title()] })
    ).toBeNull()
  })
})

describe("titleLabel", () => {
  it("compose palier et nom du sujet", () => {
    expect(titleLabel("Or", "Histoire")).toBe("Or · Histoire")
  })

  it("retombe sur le palier seul sans nom résolu", () => {
    expect(titleLabel("Or", null)).toBe("Or")
    expect(titleLabel("Or", "   ")).toBe("Or")
  })
})

describe("earnedBadges", () => {
  it("ne garde que les badges acquis, toutes familles confondues", () => {
    const collection: BadgeCollection = {
      earnedCount: 2,
      totalCount: 4,
      families: [
        {
          family: "VOLUME",
          badges: [badge({ earned: true }), badge({ code: "DUELIST_ARGENT" })],
        },
        {
          family: "EXPLOIT",
          badges: [badge({ code: "FIRST_WIN", tier: "BRONZE", earned: true })],
        },
      ],
    }

    expect(earnedBadges(collection).map((item) => item.code)).toEqual([
      "DUELIST_BRONZE",
      "FIRST_WIN",
    ])
  })
})

const FAMILIES: BadgeFamilyGroup[] = [
  {
    family: "VOLUME",
    badges: [
      badge({ earned: true, progress: 10 }),
      badge({
        code: "DUELIST_ARGENT",
        label: "Bretteur",
        progress: 12,
        target: 50,
      }),
    ],
  },
  {
    family: "EXPLOIT",
    badges: [
      badge({
        code: "FIRST_WIN",
        label: "Première victoire",
        metric: "HUMAN_WINS",
        earned: true,
        progress: 1,
        target: 1,
      }),
    ],
  },
]

const labelOf = (item: BadgeItem) => item.label

describe("filterBadgeFamilies", () => {
  it("renvoie la collection telle quelle sans filtre", () => {
    expect(
      filterBadgeFamilies(FAMILIES, { query: "", state: "ALL", labelOf })
    ).toBe(FAMILIES)
  })

  it("ne garde que les paliers acquis", () => {
    const result = filterBadgeFamilies(FAMILIES, {
      query: "",
      state: "EARNED",
      labelOf,
    })

    expect(result.map((group) => group.family)).toEqual(["VOLUME", "EXPLOIT"])
    expect(result[0].badges.map((item) => item.code)).toEqual([
      "DUELIST_BRONZE",
    ])
  })

  it("ne garde que les paliers à débloquer, familles vides retirées", () => {
    const result = filterBadgeFamilies(FAMILIES, {
      query: "",
      state: "TO_UNLOCK",
      labelOf,
    })

    expect(result.map((group) => group.family)).toEqual(["VOLUME"])
    expect(result[0].badges.map((item) => item.code)).toEqual([
      "DUELIST_ARGENT",
    ])
  })

  it("cherche sur le libellé affiché, accents et casse ignorés", () => {
    const result = filterBadgeFamilies(FAMILIES, {
      query: "PREMIERE",
      state: "ALL",
      labelOf,
    })

    expect(result.map((group) => group.family)).toEqual(["EXPLOIT"])
    // Insensible à la casse comme aux accents : « bretteur » retrouve « Bretteur ».
    expect(
      filterBadgeFamilies(FAMILIES, {
        query: "bretteur",
        state: "ALL",
        labelOf,
      })[0].badges.map((item) => item.code)
    ).toEqual(["DUELIST_ARGENT"])
  })

  it("renvoie une collection vide quand rien ne correspond", () => {
    expect(
      filterBadgeFamilies(FAMILIES, {
        query: "inexistant",
        state: "ALL",
        labelOf,
      })
    ).toEqual([])
  })
})

describe("isBadgeStateFilter", () => {
  it("n'accepte que les états connus (valeur d'URL sinon)", () => {
    expect(isBadgeStateFilter("EARNED")).toBe(true)
    expect(isBadgeStateFilter("BOGUS")).toBe(false)
    expect(isBadgeStateFilter(null)).toBe(false)
  })

  it("accepte « tous »", () => {
    expect(isBadgeStateFilter("ALL")).toBe(true)
  })
})

describe("filterTitles", () => {
  const titleOf = (overrides: Partial<UnlockedTitle> = {}): UnlockedTitle =>
    title({
      topic: {
        ...title().topic,
        titles: { fr: { OR: "Maréchal d'Empire", FER: "Soldat" } },
      },
      ...overrides,
    })
  const titles = [
    titleOf(),
    titleOf({
      key: "topic-2:FER",
      topicId: "topic-2",
      tier: "FER",
      topic: {
        ...title().topic,
        topicId: "topic-2",
        names: { fr: "Sport" },
        titles: { fr: { FER: "Sprinteur" } },
      },
    }),
  ]
  const labelOf = (entry: UnlockedTitle) =>
    entry.topic.titles?.fr?.[entry.tier] ?? titleLabel(entry.tier, null)

  it("renvoie les titres tels quels sans filtre", () => {
    expect(
      filterTitles(titles, {
        query: "",
        rank: "ALL",
        equippedOnly: false,
        equippedKey: null,
        labelOf,
      })
    ).toBe(titles)
  })

  it("cherche sur le libellé thématique et le nom du sujet, accents et casse ignorés", () => {
    expect(
      filterTitles(titles, {
        query: "MARECHAL",
        rank: "ALL",
        equippedOnly: false,
        equippedKey: null,
        labelOf,
      }).map((entry) => entry.key)
    ).toEqual(["topic-1:OR"])

    // Le libellé affiché est thématique (« Maréchal d'Empire »), mais « histoire » retrouve
    // quand même le titre par le nom de son sujet.
    expect(
      filterTitles(titles, {
        query: "histoire",
        rank: "ALL",
        equippedOnly: false,
        equippedKey: null,
        labelOf,
      }).map((entry) => entry.key)
    ).toEqual(["topic-1:OR"])
  })

  it("filtre par rang et par titre affiché", () => {
    expect(
      filterTitles(titles, {
        query: "",
        rank: "FER",
        equippedOnly: false,
        equippedKey: null,
        labelOf,
      }).map((entry) => entry.key)
    ).toEqual(["topic-2:FER"])

    expect(
      filterTitles(titles, {
        query: "",
        rank: "ALL",
        equippedOnly: true,
        equippedKey: "topic-1:OR",
        labelOf,
      }).map((entry) => entry.key)
    ).toEqual(["topic-1:OR"])
  })

  it("renvoie une liste vide quand rien ne correspond", () => {
    expect(
      filterTitles(titles, {
        query: "inexistant",
        rank: "ALL",
        equippedOnly: false,
        equippedKey: null,
        labelOf,
      })
    ).toEqual([])
  })
})

describe("isTitleRankFilter", () => {
  it("n'accepte que « tous » et les paliers connus", () => {
    expect(isTitleRankFilter("ALL")).toBe(true)
    expect(isTitleRankFilter("OR")).toBe(true)
    expect(isTitleRankFilter("BOGUS")).toBe(false)
    expect(isTitleRankFilter(null)).toBe(false)
  })
})

/** Luminance relative WCAG d'une couleur hexadécimale. */
function relativeLuminance(hex: string): number {
  const channels = hex
    .replace("#", "")
    .match(/../g)!
    .map((part) => Number.parseInt(part, 16) / 255)
    .map((value) =>
      value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    )
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Contraste de luminance entre deux aplats (1:1 → 21:1). */
function contrastRatio(a: string, b: string): number {
  const [high, low] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (left, right) => right - left
  )
  return (high + 0.05) / (low + 0.05)
}

describe("palette des paliers", () => {
  it("donne une teinte franche et **distincte** à chaque palier", () => {
    const fills = BADGE_TIERS.map((tier) => TIER_COLORS[tier].fill)

    expect(new Set(fills).size).toBe(fills.length)
    // Argent et platine ne partagent plus la même famille de teinte.
    expect(TIER_COLORS.FER.fill).not.toBe(TIER_COLORS.ARGENT.fill)
    expect(TIER_COLORS.ARGENT.fill).not.toBe(TIER_COLORS.PLATINE.fill)
    expect(TIER_COLORS.PLATINE.fill).not.toBe(TIER_COLORS.DIAMANT.fill)
  })

  it("sépare Fer et Argent par la valeur (≥ 3:1 de luminance)", () => {
    expect(
      contrastRatio(TIER_COLORS.FER.fill, TIER_COLORS.ARGENT.fill)
    ).toBeGreaterThanOrEqual(3)
  })

  it("donne aux pastilles de rang un fond **opaque** (jamais de semi-transparent)", () => {
    for (const tier of BADGE_TIERS) {
      const { soft } = TIER_COLORS[tier]
      expect(soft, tier).toContain("var(--card)")
      expect(soft, tier).not.toContain("transparent")
    }
  })

  it("pose une encre lisible sur l'aplat de chaque palier (≥ 3:1)", () => {
    for (const tier of BADGE_TIERS) {
      const { fill, onFill } = TIER_COLORS[tier]
      expect(contrastRatio(fill, onFill), tier).toBeGreaterThanOrEqual(3)
    }
  })

  it("donne au mot du palier une teinte **lisible** (verrou du ratio AA)", () => {
    for (const tier of BADGE_TIERS) {
      const { fill, text } = TIER_COLORS[tier]
      // 70 % de teinte + 30 % de texte de premier plan : contraste AA garanti dans les deux
      // thèmes. Remonter le ratio rendrait le mot illisible sur fond clair — ne pas y revenir
      // sans revérifier les contrastes.
      expect(text, tier).toContain(fill)
      expect(text, tier).toContain("70%")
      expect(text, tier).toContain("var(--foreground)")
      expect(text, tier).not.toContain("transparent")
    }
    // Une teinte texte distincte par palier, comme les aplats.
    const texts = BADGE_TIERS.map((tier) => TIER_COLORS[tier].text)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it("pose un fond plein sur une carte de titre débloquée", () => {
    expect(TITLE_CARD_ACCENT.unlocked.background).toContain("var(--card)")
    expect(TITLE_CARD_ACCENT.unlocked.background).not.toContain("transparent")
  })

  it("porte la coche d'un palier atteint sur un disque vert à encre blanche", () => {
    const { background, color } = TITLE_CARD_ACCENT.acquiredCheck
    expect(background).toContain("var(--success-600)")
    // Teinte **assombrie** (80 % de vert + noir) : l'encre blanche doit tenir le contraste d'un
    // symbole (≥ 3:1) dans les deux thèmes — même logique de lisibilité que les paliers.
    expect(background).toContain("80%")
    expect(background).toContain("black")
    expect(color).toBe("#FFFFFF")
  })
})

describe("countBadges", () => {
  it("compte les badges d'une collection filtrée", () => {
    expect(countBadges(FAMILIES)).toBe(3)
    expect(
      countBadges(
        filterBadgeFamilies(FAMILIES, {
          query: "",
          state: "EARNED",
          labelOf,
        })
      )
    ).toBe(2)
  })
})
