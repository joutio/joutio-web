/**
 * Catégories de sujets : libellés FR + couleur éditoriale.
 * Le backend renvoie `{ category, label }` (enum `TopicCategory`) mais pas de couleur ;
 * on garde une table locale alignée sur `design/tokens.json` (hex : requis par `<input type="color">`).
 */
import i18n from "@/lib/i18n"
import {
  BankIcon,
  BookOpenIcon,
  BookOpenTextIcon,
  BriefcaseIcon,
  CpuIcon,
  FilmSlateIcon,
  FlaskIcon,
  GameControllerIcon,
  GlobeHemisphereWestIcon,
  HeadphonesIcon,
  LeafIcon,
  LightbulbIcon,
  PaletteIcon,
  PizzaIcon,
  ShapesIcon,
  StarIcon,
  TelevisionSimpleIcon,
  VolleyballIcon,
  type Icon as IconType,
} from "@phosphor-icons/react"

const CATEGORY_COLORS: Record<string, string> = {
  ARTS: "#C79DE6",
  BUSINESS: "#5FC8A6",
  EDUCATION: "#4DC3DD",
  ENTERTAINMENT: "#96AEF7",
  FOOD_AND_DRINK: "#ED997B",
  GAMES: "#BBB55E",
  GENERAL: "#B1B1B1",
  HISTORY: "#E79E6B",
  LITERATURE: "#B0A5F2",
  MOVIES: "#E694BB",
  MUSIC: "#D997D2",
  NATURE: "#A1BD6E",
  SCIENCE: "#5DBEE9",
  SPORTS: "#46C6CD",
  TECHNOLOGY: "#79B6F4",
  TELEVISION: "#EC93A8",
  WORLD: "#4DC8BA",
}

function normalize(code: string): string {
  return code?.toUpperCase() ?? ""
}

const CATEGORY_ICONS: Record<string, IconType> = {
  ARTS: PaletteIcon,
  BUSINESS: BriefcaseIcon,
  EDUCATION: BookOpenIcon,
  ENTERTAINMENT: StarIcon,
  FOOD_AND_DRINK: PizzaIcon,
  GAMES: GameControllerIcon,
  GENERAL: LightbulbIcon,
  HISTORY: BankIcon,
  LITERATURE: BookOpenTextIcon,
  MOVIES: FilmSlateIcon,
  MUSIC: HeadphonesIcon,
  NATURE: LeafIcon,
  SCIENCE: FlaskIcon,
  SPORTS: VolleyballIcon,
  TELEVISION: TelevisionSimpleIcon,
  TECHNOLOGY: CpuIcon,
  WORLD: GlobeHemisphereWestIcon,
}

/** Icône Phosphor illustrative de la catégorie (repli générique `Shapes`). */
export function categoryIcon(code: string): IconType {
  return CATEGORY_ICONS[normalize(code)] ?? ShapesIcon
}

export function categoryColor(code: string): string {
  return CATEGORY_COLORS[normalize(code)] ?? CATEGORY_COLORS.GENERAL
}

/**
 * Teinte de catégorie lisible sur les surfaces de texte : mélange la couleur éditoriale avec
 * `--foreground`. À 60 %, le contraste reste AA (≥ 5:1) en clair comme en sombre.
 */
export function categoryTextColor(code: string): string {
  return `color-mix(in oklab, ${categoryColor(code)} 60%, var(--foreground))`
}

export function categoryLabel(code: string, fallback?: string): string {
  return i18n.t(`shared.categories.labels.${normalize(code)}`, {
    defaultValue: fallback ?? code,
  })
}

/** Tagline éditoriale par catégorie (repli quand le sujet n'a pas de description). */
export function categoryTagline(code: string): string {
  return i18n.t(`shared.categories.taglines.${normalize(code)}`, {
    defaultValue: i18n.t("shared.categories.defaultTagline"),
  })
}
