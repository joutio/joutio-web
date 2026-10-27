import { Avatar, Style } from "@dicebear/core"
import type { StyleDefinition, StyleOptions } from "@dicebear/core"
import { hashString } from "@/lib/helpers"
import {
  DEFAULT_AVATAR_STYLE,
  getAvatarStyle,
  isActiveAvatarStyleId,
  resolveAvatarStyleId,
} from "./styles"
import type {
  AvatarOptions,
  AvatarStyleDefinition,
  AvatarStyleId,
} from "./styles/types"

const styleInstances = new Map<AvatarStyleId, Style>()

function dicebearStyle(definition: AvatarStyleDefinition): Style {
  const existing = styleInstances.get(definition.id)
  if (existing) return existing
  const instance = new Style(definition.definition as StyleDefinition)
  styleInstances.set(definition.id, instance)
  return instance
}

const cache = new Map<string, string>()
const CACHE_LIMIT = 600

function pick<T>(list: readonly T[], random: () => number): T {
  return list[Math.floor(random() * list.length)]
}

/** PRNG déterministe (mulberry32) pour dériver un avatar stable depuis un seed. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function variantOptions(
  field: string,
  value: string | undefined,
  optional: boolean
): Record<string, unknown> {
  if (optional && value === "none") return { [`${field}Probability`]: 0 }
  if (!value) return {}
  return { [`${field}Variant`]: [value], [`${field}Probability`]: 100 }
}

/** Fond opaque par défaut d'un style (jamais transparent). */
function styleBackground(definition: AvatarStyleDefinition): string {
  return definition.defaults.backgroundColor || "#ffffff"
}

/** Convertit les options compactes persistées en options DiceBear valides. */
export function toDicebearOptions(options: AvatarOptions): StyleOptions {
  const definition = getAvatarStyle(options.style)
  const result: Record<string, unknown> = { borderRadius: 50 }
  result.backgroundColor = [
    options.backgroundColor || styleBackground(definition),
  ]
  for (const field of definition.variantFields) {
    const transparentNone = definition.transparentNoneFields?.[field]
    if (transparentNone && options[field] === "none") {
      result[`${field}Variant`] = [transparentNone.variant]
      result[`${field}Probability`] = 100
      continue
    }
    Object.assign(
      result,
      variantOptions(
        field,
        options[field],
        definition.optionalFields.includes(field)
      )
    )
  }
  for (const field of definition.colorFields) {
    const value = options[field]
    if (value) result[field] = [value]
  }
  // Couleurs dérivées (barbe Lorelei = couleur des cheveux) : calculées depuis les options
  // persistées, avant l'éventuel override transparent de « Aucun ».
  for (const [field, derived] of Object.entries(
    definition.derivedColors ?? {}
  )) {
    result[field] = [
      options[derived.from] ||
        definition.defaults[derived.from] ||
        derived.fallback,
    ]
  }
  // Lorelei : `hair` porte la tête. Retirer le composant efface le visage ; on garde une
  // variante de cheveux avec une couleur transparente pour obtenir un crâne rasé.
  for (const [field, transparentNone] of Object.entries(
    definition.transparentNoneFields ?? {}
  )) {
    if (options[field] !== "none") continue
    result[transparentNone.color] = ["#00000000"]
  }
  return result as StyleOptions
}

function stableKey(options: AvatarOptions): string {
  return JSON.stringify(options, Object.keys(options).sort())
}

/**
 * Rend un avatar en data URI SVG. Sans options persistées, l'avatar est dérivé
 * de façon déterministe du `seed` (userId/nom) dans le style par défaut.
 */
export function avatarDataUri(
  options: AvatarOptions | undefined,
  size: number,
  seed?: string
): string {
  const styleId = options
    ? resolveAvatarStyleId(options.style)
    : DEFAULT_AVATAR_STYLE
  const key = `${styleId}:${seed ?? ""}:${size}:${options ? stableKey(options) : "seed"}`
  const cached = cache.get(key)
  if (cached) return cached
  const style = getAvatarStyle(styleId)
  const dicebearOptions = options
    ? toDicebearOptions(options)
    : { backgroundColor: [styleBackground(style)] }
  const uri = new Avatar(dicebearStyle(style), {
    seed: seed ?? "joutio",
    size,
    ...dicebearOptions,
  }).toDataUri()
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, uri)
  return uri
}

/**
 * Parse une sérialisation d'options persistées, en tolérant l'absence/le contenu
 * invalide. Un `style` inconnu **ou désactivé** est retiré (repli sur le style par défaut).
 */
export function parseAvatarOptions(
  json: string | undefined | null
): AvatarOptions | undefined {
  if (!json) return undefined
  try {
    const parsed: unknown = JSON.parse(json)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const options = parsed as Record<string, unknown>
      if (!isActiveAvatarStyleId(options.style)) delete options.style
      return options as AvatarOptions
    }
    return undefined
  } catch {
    return undefined
  }
}

function generateOptions(
  random: () => number,
  styleId: AvatarStyleId
): AvatarOptions {
  const definition = getAvatarStyle(styleId)
  const options: AvatarOptions = {}
  if (styleId !== DEFAULT_AVATAR_STYLE) options.style = styleId
  for (const field of definition.variantFields) {
    const variants = definition.variants[field]
    if (!variants || variants.length === 0) continue
    if (definition.optionalFields.includes(field)) {
      options[field] = random() < 0.35 ? pick(variants, random) : "none"
    } else {
      options[field] = pick(variants, random)
    }
  }
  for (const field of definition.colorFields) {
    const palette = definition.palettes[field]
    if (palette && palette.length > 0) options[field] = pick(palette, random)
  }
  return options
}

/** Options déterministes dérivées d'un seed (userId / nom). */
export function defaultAvatarOptions(
  seed: string,
  styleId: AvatarStyleId = DEFAULT_AVATAR_STYLE
): AvatarOptions {
  return generateOptions(mulberry32(hashString(seed)), styleId)
}

/** Options aléatoires (bouton « Aléatoire »). */
export function randomAvatarOptions(
  styleId: AvatarStyleId = DEFAULT_AVATAR_STYLE
): AvatarOptions {
  return generateOptions(Math.random, styleId)
}

/**
 * Options compactes de l'avatar dérivé d'un seed — l'état **affiché** d'un joueur sans options
 * persistées (`UserAvatar`). Sert de point de départ à l'éditeur pour ne pas repartir du preset
 * par défaut : on relit les options résolues par DiceBear (fond par défaut inclus, pour coller
 * exactement au rendu `avatarDataUri` sans options) et on les remappe vers `AvatarOptions`.
 */
export function seedAvatarOptions(
  seed: string,
  styleId: AvatarStyleId = DEFAULT_AVATAR_STYLE
): AvatarOptions {
  const definition = getAvatarStyle(styleId)
  const resolved = new Avatar(dicebearStyle(definition), {
    seed,
    backgroundColor: [styleBackground(definition)],
  }).toJSON().options as Record<string, unknown>

  const options: AvatarOptions = {}
  if (styleId !== DEFAULT_AVATAR_STYLE) options.style = styleId
  for (const field of definition.variantFields) {
    const value = resolved[`${field}Variant`]
    if (typeof value === "string") {
      options[field] = value
    } else if (definition.optionalFields.includes(field)) {
      options[field] = "none"
    }
  }
  for (const field of definition.colorFields) {
    const value = resolved[field]
    if (Array.isArray(value) && typeof value[0] === "string") {
      options[field] = value[0]
    }
  }
  if (options.backgroundColor === undefined) {
    options.backgroundColor = styleBackground(definition)
  }
  return options
}
