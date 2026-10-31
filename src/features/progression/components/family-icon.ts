import {
  CalendarCheckIcon,
  CompassIcon,
  CrownIcon,
  EyeIcon,
  FireIcon,
  FlagIcon,
  GaugeIcon,
  GraduationCapIcon,
  LightningIcon,
  MegaphoneIcon,
  SparkleIcon,
  StackIcon,
  StarIcon,
  SwordIcon,
  TargetIcon,
  TrendUpIcon,
  UsersIcon,
  type Icon as IconType,
} from "@phosphor-icons/react"
import type { BadgeFamily } from "../domain/progression"

/**
 * Icône d'une **famille** de badges (médailles de la collection et des célébrations) — **une
 * famille = une échelle**, donc un emblème par échelle. Aucun doublon : `EXPLOIT` (repli des
 * exploits ponctuels) et `SERIES` ne partagent plus le même glyphe.
 */
export const FAMILY_ICONS: Record<BadgeFamily, IconType> = {
  VOLUME: SwordIcon,
  VICTORY: CrownIcon,
  MASTERY: GraduationCapIcon,
  EXPLOIT: SparkleIcon,
  SERIES: FireIcon,
  ASSIDUITY: CalendarCheckIcon,
  SOCIAL: UsersIcon,
  CHALLENGES: MegaphoneIcon,
  VISION: EyeIcon,
  PRECISION: TargetIcon,
  SPEED: GaugeIcon,
  EXPLORATION: CompassIcon,
  COLLECTION: StackIcon,
}

/**
 * Emblème **propre** d'un exploit ponctuel (plusieurs exploits cohabitent dans la famille
 * `EXPLOIT`, chacun doit rester reconnaissable).
 */
export const ONE_SHOT_ICONS: Record<string, IconType> = {
  FIRST_WIN: FlagIcon,
  LIGHTNING: LightningIcon,
  PERFECT: StarIcon,
  STREAK_MASTER: TrendUpIcon,
}

/**
 * Emblème d'un badge : celui de son exploit pour un fait ponctuel, sinon celui de sa famille —
 * un code inconnu du web retombe sur l'emblème de sa famille (pas de release nécessaire).
 */
export function badgeIcon(code: string, family: BadgeFamily): IconType {
  return ONE_SHOT_ICONS[code] ?? FAMILY_ICONS[family]
}
