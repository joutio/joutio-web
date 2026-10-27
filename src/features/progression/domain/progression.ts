/**
 * Contrat partagé de la progression : collection de badges et titres thématiques.
 * Purement descriptif + règles pures (aucune dépendance React ni infra) — cf.
 * `best-practices/.frontend/folder-structure.md`.
 */

import type { TopicRef } from "@/features/topics/domain/topic"

/** Famille d'un badge (`BadgeFamily` backend). */
export type BadgeFamily =
  | "VOLUME"
  | "VICTORY"
  | "MASTERY"
  | "EXPLOIT"
  | "SERIES"
  | "ASSIDUITY"
  | "SOCIAL"
  | "CHALLENGES"
  | "VISION"
  | "PRECISION"
  | "SPEED"
  | "EXPLORATION"
  | "COLLECTION"

/**
 * Palier de rareté (Fer → Diamant), partagé par les **paliers de badges** (`BadgeTier` backend)
 * et les **paliers de maîtrise** (`MasteryTier` backend). Une seule échelle, deux usages.
 */
export type Rank =
  "FER" | "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "EMERAUDE" | "DIAMANT"

/** Palier d'un badge (`BadgeTier` backend) — le métal donne la rareté à l'affichage. */
export type BadgeTier = Rank

/** Palier de maîtrise d'un sujet (`MasteryTier` backend). */
export type MasteryTier = Rank

/** Compteur mesuré par un badge (`BadgeMetric` backend). */
export type BadgeMetric =
  | "HUMAN_DUELS"
  | "HUMAN_WINS"
  | "TOPIC_MASTERY"
  | "DISTINCT_TOPICS"
  | "WIN_STREAK"
  | "PERFECT_DUELS"
  | "FAST_ANSWERS"
  | "DAILY_STREAK"
  | "FOLLOWERS_GAINED"
  | "CHALLENGES_SENT"
  | "IMAGE_CORRECT"
  | "EARNED_BADGES"
  | "ONE_SHOT"

/** Un palier de badge (`BadgeCollectionView.BadgeItemView`). */
export interface BadgeItem {
  code: string
  /** Libellé source du catalogue (français) — repli si le client n'a pas la traduction. */
  label: string
  tier: BadgeTier
  metric: BadgeMetric
  target: number
  earned: boolean
  /** Compteur courant, plafonné à `target`. */
  progress: number
}

export interface BadgeFamilyGroup {
  family: BadgeFamily
  badges: BadgeItem[]
}

/** Collection complète (`BadgeCollectionView`). */
export interface BadgeCollection {
  earnedCount: number
  totalCount: number
  families: BadgeFamilyGroup[]
}

/** Titre débloqué (`TitlesView.TitleView`). */
export interface UnlockedTitle {
  /** Clé stable `topicId:TIER` — celle attendue par `PUT /api/profiles/{id}/title`. */
  key: string
  topicId: string
  tier: MasteryTier
  tierProgressPercent: number
  tierRemainingXp: number
  nextTier: MasteryTier | null
  topic: TopicRef
}

/** Titres d'un joueur (`TitlesView`). */
export interface PlayerTitles {
  equippedKey: string | null
  titles: UnlockedTitle[]
}

/** Ordre d'affichage des familles (du plus « volume » au plus rare) — **une famille = une échelle**. */
export const BADGE_FAMILIES: readonly BadgeFamily[] = [
  "VOLUME",
  "VICTORY",
  "MASTERY",
  "EXPLOIT",
  "SERIES",
  "ASSIDUITY",
  "SOCIAL",
  "CHALLENGES",
  "VISION",
  "PRECISION",
  "SPEED",
  "EXPLORATION",
  "COLLECTION",
]

/** Ordre croissant des rangs / paliers (Fer → Diamant). */
export const BADGE_TIERS: readonly BadgeTier[] = [
  "FER",
  "BRONZE",
  "ARGENT",
  "OR",
  "PLATINE",
  "EMERAUDE",
  "DIAMANT",
]

/**
 * Couleurs d'un palier de rareté : **une teinte franche par palier** (aucun doublon), partagée
 * par les badges et les titres. Les sceaux et rubans SVG sont la référence visuelle ; cette
 * palette en est le miroir pour les surfaces sans asset (pastilles de rang, points et barres,
 * textes de palier).
 */
export interface TierColor {
  /** Aplat de référence du palier (point de rang, barre XP, barre d'une fiche de badge). */
  fill: string
  /** Encre posée sur `fill` (disques de célébration) — contraste ≥ 3:1. */
  onFill: string
  /** Fond **opaque** des pastilles de rang (mélange à la surface `--card`). */
  soft: string
  /**
   * Encre du **mot du palier** posé sur la surface (tuile, fiche, sous-titre de modale) :
   * teinte du palier mélangée au texte de premier plan — assombrie en clair, éclaircie en sombre,
   * donc **lisible AA dans les deux thèmes** (le `fill` brut échoue en clair pour les métaux
   * clairs : Or, Platine, Argent, Diamant).
   */
  text: string
}

const tierColor = (fill: string, onFill: string): TierColor => ({
  fill,
  onFill,
  // Jamais de semi-transparent : la teinte est mélangée à la surface (`--card`), elle reste pleine.
  soft: `color-mix(in oklab, ${fill} 15%, var(--card))`,
  // 70 % de teinte : le maximum qui garde la couleur reconnaissable tout en passant AA partout.
  text: `color-mix(in oklab, ${fill} 70%, var(--foreground))`,
})

/**
 * Palette des paliers, **alignée sur les métaux** des sceaux `product/badge` et des rubans
 * `product/ruban` : graphite → cuivre → acier → or → **acier bleu** → émeraude → **cyan**.
 * Elle pilote les pastilles de rang, les points/barres de titre et les textes de palier ; les
 * sceaux SVG restent la référence visuelle.
 */
export const TIER_COLORS: Record<BadgeTier, TierColor> = {
  // Fer : graphite volontairement plus sombre que l'argent (≥ 3:1 de contraste de luminance) —
  // les deux paliers ne se confondent jamais, l'argent restant l'acier clair.
  FER: tierColor("#3F444C", "#FFFFFF"),
  BRONZE: tierColor("#B86A32", "#FFFFFF"),
  ARGENT: tierColor("#8C95A3", "#1E242B"),
  OR: tierColor("#D9A826", "#3A2A00"),
  PLATINE: tierColor("#8C9FC9", "#1F2A4A"),
  EMERAUDE: tierColor("#2FBF77", "#04301B"),
  DIAMANT: tierColor("#5DB4E2", "#0D3250"),
}

/**
 * Teinte d'un palier, avec repli **bronze** pour un palier inconnu d'un client plus ancien :
 * un futur palier ajouté côté serveur ne doit jamais casser la collection.
 */
export function tierColorOf(tier: string): TierColor {
  return TIER_COLORS[tier as BadgeTier] ?? TIER_COLORS.BRONZE
}

/**
 * Seuils d'XP **dans un sujet** par palier de maîtrise (miroir de `MasteryTier` backend —
 * `Fer 0 · Bronze 500 · Argent 1 500 · Or 4 000 · Platine 9 000 · Émeraude 21 000 ·
 * Diamant 45 000`). Constante d'affichage, comme les couleurs de catégorie.
 */
export const MASTERY_TIER_THRESHOLDS: Record<MasteryTier, number> = {
  FER: 0,
  BRONZE: 500,
  ARGENT: 1500,
  OR: 4000,
  PLATINE: 9000,
  EMERAUDE: 21000,
  DIAMANT: 45000,
}

/** Ordre croissant des paliers de maîtrise. */
export const MASTERY_TIERS: readonly MasteryTier[] = [
  "FER",
  "BRONZE",
  "ARGENT",
  "OR",
  "PLATINE",
  "EMERAUDE",
  "DIAMANT",
]

/** Progression d'un badge en pourcentage (0–100) — barre des paliers verrouillés. */
export function badgeProgressPercent(badge: BadgeItem): number {
  if (badge.target <= 0) return 0
  const ratio = (badge.progress / badge.target) * 100
  return Math.max(0, Math.min(100, Math.round(ratio)))
}

/** Progression d'un titre vers un seuil d'XP (0–100) — barre du panneau des titres. */
export function titleProgressPercent(xp: number, target: number): number {
  if (target <= 0) return 0
  const ratio = (xp / target) * 100
  return Math.max(0, Math.min(100, Math.round(ratio)))
}

/** Le titre porté, résolu dans la liste des titres débloqués (`null` si aucun ou introuvable). */
export function equippedTitle(
  titles: PlayerTitles | undefined | null
): UnlockedTitle | null {
  if (!titles?.equippedKey) return null
  return titles.titles.find((title) => title.key === titles.equippedKey) ?? null
}

/**
 * Libellé d'un titre : palier + nom du sujet (« Or · Histoire »), ou le palier seul si le
 * nom n'est pas résolu. Le serveur ne compose jamais ce libellé.
 */
export function titleLabel(
  tierLabel: string,
  topicName: string | null | undefined
): string {
  const name = topicName?.trim()
  return name ? `${tierLabel} · ${name}` : tierLabel
}

/**
 * Titre **thématique** porté par le sujet pour ce palier (ex. « Maréchal d'Empire »), dans la
 * langue du lecteur, avec repli FR. `null` si le sujet n'en définit pas (l'appelant retombe alors
 * sur {@link titleLabel}).
 */
export function topicTitleFor(
  titles: Record<string, Record<string, string>> | null | undefined,
  tier: MasteryTier,
  language: string
): string | null {
  return titles?.[language]?.[tier] ?? titles?.fr?.[tier] ?? null
}

/** Les badges acquis d'une collection, toutes familles confondues. */
export function earnedBadges(collection: BadgeCollection): BadgeItem[] {
  return collection.families.flatMap((group) =>
    group.badges.filter((badge) => badge.earned)
  )
}

/** État d'un badge dans la collection (filtre client de l'onglet Badges). */
export type BadgeStateFilter = "ALL" | "EARNED" | "TO_UNLOCK"

export const BADGE_STATE_FILTERS: readonly BadgeStateFilter[] = [
  "ALL",
  "EARNED",
  "TO_UNLOCK",
]

/** Garde du filtre d'état : une valeur d'URL inconnue retombe sur « tous ». */
export function isBadgeStateFilter(
  value: string | null
): value is BadgeStateFilter {
  return (
    value !== null && (BADGE_STATE_FILTERS as readonly string[]).includes(value)
  )
}

/** Repli sans accent ni casse (miroir de `@/lib/helpers.normalize`, non importable du domaine). */
function foldLabel(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export interface BadgeFilterOptions {
  /** Recherche libre sur le libellé affiché (accent/casse ignorés). */
  query: string
  state: BadgeStateFilter
  /** Libellé affiché d'un badge (traduction connue ou repli serveur) — résolu par l'appelant. */
  labelOf: (badge: BadgeItem) => string
}

/**
 * Filtre **client** de la collection (le catalogue complet est déjà chargé) : recherche sur le
 * libellé et état du badge, en conservant l'ordre des familles et des paliers. Les familles sans
 * résultat sont retirées ; sans filtre, la collection est renvoyée telle quelle.
 */
export function filterBadgeFamilies(
  families: BadgeFamilyGroup[],
  options: BadgeFilterOptions
): BadgeFamilyGroup[] {
  const needle = foldLabel(options.query)
  if (!needle && options.state === "ALL") return families

  return families.flatMap((group) => {
    const badges = group.badges.filter((badge) => {
      if (options.state === "EARNED" && !badge.earned) return false
      if (options.state === "TO_UNLOCK" && badge.earned) return false
      return !needle || foldLabel(options.labelOf(badge)).includes(needle)
    })
    return badges.length > 0 ? [{ family: group.family, badges }] : []
  })
}

/** Le nombre de badges d'une collection filtrée (compteur du bandeau de filtres). */
export function countBadges(families: BadgeFamilyGroup[]): number {
  return families.reduce((total, group) => total + group.badges.length, 0)
}

/** Filtre de rang de l'onglet Titres du profil (« tous » ou un palier de maîtrise). */
export type TitleRankFilter = "ALL" | MasteryTier

/** Valeurs du filtre de rang, du plus commun au plus rare. */
export const TITLE_RANK_FILTERS: readonly TitleRankFilter[] = [
  "ALL",
  ...BADGE_TIERS,
]

/** Garde du filtre de rang : une valeur d'URL inconnue retombe sur « tous ». */
export function isTitleRankFilter(
  value: string | null
): value is TitleRankFilter {
  return (
    value !== null && (TITLE_RANK_FILTERS as readonly string[]).includes(value)
  )
}

export interface TitleFilterOptions {
  /** Recherche libre sur le libellé affiché et les noms du sujet (accent/casse ignorés). */
  query: string
  rank: TitleRankFilter
  /** Ne garder que le titre actuellement porté. */
  equippedOnly: boolean
  equippedKey: string | null
  /** Libellé affiché d'un titre (titre thématique ou repli « Palier · Sujet »). */
  labelOf: (title: UnlockedTitle) => string
}

/**
 * Filtre **client** de l'onglet Titres d'un profil : le joueur n'expose que ses titres déjà
 * débloqués, la recherche et les filtres n'appellent donc jamais le BFF. L'ordre reçu (trié par
 * rang par l'appelant) est conservé. La recherche couvre le libellé composé **et** les noms du
 * sujet, pour retrouver un titre thématique par le nom de son sujet.
 */
export function filterTitles(
  titles: UnlockedTitle[],
  options: TitleFilterOptions
): UnlockedTitle[] {
  const needle = foldLabel(options.query)
  if (!needle && options.rank === "ALL" && !options.equippedOnly) return titles

  return titles.filter((title) => {
    if (options.equippedOnly && title.key !== options.equippedKey) return false
    if (options.rank !== "ALL" && title.tier !== options.rank) return false
    if (!needle) return true
    const haystack = [
      options.labelOf(title),
      ...Object.values(title.topic.names ?? {}),
    ]
      .map(foldLabel)
      .join(" ")
    return haystack.includes(needle)
  })
}

/**
 * Accent d'une carte de **titre** — même code couleur que les badges : le **vert** (`success-600`)
 * marque un palier **atteint** (pastille à coche **blanche** en tête de carte) ; le titre **porté**
 * garde l'accent primaire (état distinct). Mélanges **opaques** (contre `--card`), sans ombre.
 */
export const TITLE_CARD_ACCENT = {
  equipped: {
    borderColor: "color-mix(in oklab, var(--primary) 40%, transparent)",
  },
  unlocked: {
    borderColor: "color-mix(in oklab, var(--success-600) 40%, transparent)",
    background: "color-mix(in oklab, var(--success-600) 8%, var(--card))",
  },
  /**
   * Pastille d’état d’un palier **atteint** (tête de carte, fiche sujet) : disque vert portant une
   * **coche blanche**. La teinte `success-600` est assombrie (mélange opaque au noir) pour que
   * l'encre blanche tienne le contraste d'un symbole (≥ 3:1) dans les deux thèmes — même logique
   * de lisibilité que les paliers de badges.
   */
  acquiredCheck: {
    background: "color-mix(in oklab, var(--success-600) 80%, black)",
    color: "#FFFFFF",
  },
} as const
