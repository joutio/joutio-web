import {
  CalendarCheck,
  Compass,
  Crown,
  Eye,
  Flag,
  Flame,
  Gauge,
  GraduationCap,
  Layers,
  Megaphone,
  Sparkles,
  Star,
  Swords,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"
import type { BadgeFamily } from "../domain/progression"

/**
 * Icône d'une **famille** de badges (médailles de la collection et des célébrations) — **une
 * famille = une échelle**, donc un emblème par échelle. Aucun doublon : `EXPLOIT` (repli des
 * exploits ponctuels) et `SERIES` ne partagent plus le même glyphe.
 */
export const FAMILY_ICONS: Record<BadgeFamily, LucideIcon> = {
  VOLUME: Swords,
  VICTORY: Crown,
  MASTERY: GraduationCap,
  EXPLOIT: Sparkles,
  SERIES: Flame,
  ASSIDUITY: CalendarCheck,
  SOCIAL: Users,
  CHALLENGES: Megaphone,
  VISION: Eye,
  PRECISION: Target,
  SPEED: Gauge,
  EXPLORATION: Compass,
  COLLECTION: Layers,
}

/**
 * Emblème **propre** d'un exploit ponctuel (plusieurs exploits cohabitent dans la famille
 * `EXPLOIT`, chacun doit rester reconnaissable).
 */
export const ONE_SHOT_ICONS: Record<string, LucideIcon> = {
  FIRST_WIN: Flag,
  LIGHTNING: Zap,
  PERFECT: Star,
  STREAK_MASTER: TrendingUp,
}

/**
 * Emblème d'un badge : celui de son exploit pour un fait ponctuel, sinon celui de sa famille —
 * un code inconnu du web retombe sur l'emblème de sa famille (pas de release nécessaire).
 */
export function badgeIcon(code: string, family: BadgeFamily): LucideIcon {
  return ONE_SHOT_ICONS[code] ?? FAMILY_ICONS[family]
}
