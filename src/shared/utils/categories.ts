/**
 * Catégories de sujets : libellés FR + couleur éditoriale.
 * Le backend renvoie `{ category, label }` (enum `TopicCategory`) mais pas de couleur ;
 * on garde une table locale alignée sur la maquette (`product/maquettes`).
 */
import i18n from "@/lib/i18n"
import {
  BookOpen,
  BookOpenText,
  BriefcaseBusiness,
  Clapperboard,
  Cpu,
  FlaskConical,
  Gamepad2,
  Globe,
  Headphones,
  Landmark,
  Leaf,
  Lightbulb,
  Palette,
  Pizza,
  Shapes,
  Star,
  Tv,
  Volleyball,
  type LucideIcon,
} from "lucide-react"

const CATEGORY_COLORS: Record<string, string> = {
  ARTS: "#f97316",
  BUSINESS: "#eab308",
  EDUCATION: "#0ea5e9",
  ENTERTAINMENT: "#ef4444",
  FOOD_AND_DRINK: "#f43f5e",
  GAMES: "#22c55e",
  GENERAL: "#8b5cf6",
  HISTORY: "#a855f7",
  LITERATURE: "#f97316",
  MOVIES: "#ef4444",
  MUSIC: "#ec4899",
  NATURE: "#22c55e",
  SCIENCE: "#06b6d4",
  SPORTS: "#14b8a6",
  TELEVISION: "#f59e0b",
  TECHNOLOGY: "#06b6d4",
  WORLD: "#8b5cf6",
}

function normalize(code: string): string {
  return code?.toUpperCase() ?? ""
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  ARTS: Palette,
  BUSINESS: BriefcaseBusiness,
  EDUCATION: BookOpen,
  ENTERTAINMENT: Star,
  FOOD_AND_DRINK: Pizza,
  GAMES: Gamepad2,
  GENERAL: Lightbulb,
  HISTORY: Landmark,
  LITERATURE: BookOpenText,
  MOVIES: Clapperboard,
  MUSIC: Headphones,
  NATURE: Leaf,
  SCIENCE: FlaskConical,
  SPORTS: Volleyball,
  TELEVISION: Tv,
  TECHNOLOGY: Cpu,
  WORLD: Globe,
}

/** Icône lucide illustrative de la catégorie (repli générique `Shapes`). */
export function categoryIcon(code: string): LucideIcon {
  return CATEGORY_ICONS[normalize(code)] ?? Shapes
}

export function categoryColor(code: string): string {
  return CATEGORY_COLORS[normalize(code)] ?? "#8b5cf6"
}

/**
 * Teinte de catégorie lisible sur les surfaces de texte : mélange la couleur éditoriale avec
 * `--foreground`, donc plus sombre en clair et plus claire en sombre.
 */
export function categoryTextColor(code: string): string {
  return `color-mix(in oklab, ${categoryColor(code)} 70%, var(--foreground))`
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
