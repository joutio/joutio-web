import { BACKGROUND_COLORS } from "./styles/palettes"
import {
  isAvatarStyleId,
  type AvatarOptions,
  type AvatarStyleId,
} from "./styles"

export const BASE_AVATAR_STYLE = "base" as const
export const BASE_BACKGROUND_GROUP_ID = "base-background"
export type BaseAvatarStyleId = typeof BASE_AVATAR_STYLE
export type AvatarPresetId = AvatarStyleId | BaseAvatarStyleId

/** Avatar de base : icône générique Lucide + fond issu de la palette Micah. */
export interface BaseAvatarOptions {
  style: BaseAvatarStyleId
  /** Couleur de fond (hex de {@link BACKGROUND_COLORS}). */
  backgroundColor?: string
}

export type AvatarConfig = AvatarOptions | BaseAvatarOptions

export const DEFAULT_BASE_AVATAR_BACKGROUND = BACKGROUND_COLORS[0]

/** Anciennes clés de la palette transitoire : normalisées vers le nuancier Micah. */
const LEGACY_BACKGROUND_KEYS: Record<string, string> = {
  gray: "#e4e4e7",
  blue: "#dbeafe",
  teal: "#e0f2fe",
  green: "#dcfce7",
  yellow: "#fef9c3",
  orange: "#ffe4e6",
  pink: "#ffe4e6",
  purple: "#fae8ff",
  red: "#ffe4e6",
}

export function normalizeBaseAvatarBackground(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_BASE_AVATAR_BACKGROUND
  const normalized = value.toLowerCase()
  if (BACKGROUND_COLORS.includes(normalized)) return normalized
  return LEGACY_BACKGROUND_KEYS[normalized] ?? DEFAULT_BASE_AVATAR_BACKGROUND
}

export function parseAvatarConfig(
  json: string | undefined | null
): AvatarConfig | undefined {
  if (!json) return undefined
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined
    }
    const options = parsed as Record<string, unknown>
    if (options.style === BASE_AVATAR_STYLE) {
      return {
        style: BASE_AVATAR_STYLE,
        backgroundColor: normalizeBaseAvatarBackground(options.backgroundColor),
      }
    }
    // Les options DiceBear historiques ne portent pas toujours `style` : Micah par défaut.
    if (!isAvatarStyleId(options.style)) delete options.style
    return options as AvatarOptions
  } catch {
    return undefined
  }
}

export function isBaseAvatarConfig(
  config: AvatarConfig | undefined
): config is BaseAvatarOptions {
  return config?.style === BASE_AVATAR_STYLE
}

export function baseAvatarBackground(config: BaseAvatarOptions): string {
  return normalizeBaseAvatarBackground(config.backgroundColor)
}
