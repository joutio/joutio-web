import { micahStyle } from "./micah"
import type {
  AvatarOptions,
  AvatarStyleDefinition,
  AvatarStyleId,
} from "./types"

export type {
  AvatarOptions,
  AvatarStyleDefinition,
  AvatarStyleGroup,
  AvatarStyleId,
  AvatarStyleSection,
} from "./types"
export {
  NONE_LABEL_KEY,
  STYLE_GROUP_ID,
  humanizeVariant,
  numberedVariants,
} from "./labels"
export type { HumanizedVariant } from "./labels"

/** Tous les styles **connus** (ids valides : rétrocompat des options persistées). */
const ALL_AVATAR_STYLE_IDS: AvatarStyleId[] = ["micah", "lorelei", "notionists"]

/**
 * Styles **actifs** : proposés dans l'éditeur et acceptés à la lecture des options persistées.
 * Les trois styles sont proposés ; l'accès reste contrôlé par le compte Premium côté UI/BFF.
 */
export const AVATAR_STYLE_IDS: AvatarStyleId[] = [
  "micah",
  "lorelei",
  "notionists",
]

/** Micah reste le style historique par défaut (rétrocompat des JSON sans `style`). */
export const DEFAULT_AVATAR_STYLE: AvatarStyleId = "micah"

/**
 * Définitions chargées **à la demande** : seul `micah` (style actif) est embarqué au boot — les
 * JSON volumineux de `lorelei` (~115 Ko) et `notionists` (~364 Ko) ne sont chargés que si un
 * avatar persisté ou un test les demande (`loadAvatarStyle`).
 */
const loadedStyles = new Map<AvatarStyleId, AvatarStyleDefinition>([
  ["micah", micahStyle],
])

const STYLE_LOADERS: Record<
  AvatarStyleId,
  () => Promise<AvatarStyleDefinition>
> = {
  micah: () => Promise.resolve(micahStyle),
  lorelei: () => import("./lorelei").then((module) => module.loreleiStyle),
  notionists: () =>
    import("./notionists").then((module) => module.notionistsStyle),
}

export function isAvatarStyleId(value: unknown): value is AvatarStyleId {
  return (
    typeof value === "string" &&
    (ALL_AVATAR_STYLE_IDS as readonly string[]).includes(value)
  )
}

/** Style actif — les styles désactivés retombent sur le style par défaut. */
export function isActiveAvatarStyleId(value: unknown): value is AvatarStyleId {
  return (
    typeof value === "string" &&
    (AVATAR_STYLE_IDS as readonly string[]).includes(value)
  )
}

export function resolveAvatarStyleId(id: string | undefined): AvatarStyleId {
  return isAvatarStyleId(id) ? id : DEFAULT_AVATAR_STYLE
}

/** Définition déjà chargée (`undefined` si le style doit encore l'être). */
export function getLoadedAvatarStyle(
  id: string | undefined
): AvatarStyleDefinition | undefined {
  return loadedStyles.get(resolveAvatarStyleId(id))
}

/**
 * Définition **requise en synchrone**. Lève si le style n'a pas été chargé : les appelants
 * doivent passer par `loadAvatarStyle`/`loadAllAvatarStyles` (ou `getLoadedAvatarStyle` pour
 * un rendu différé).
 */
export function getAvatarStyle(id: string | undefined): AvatarStyleDefinition {
  const styleId = resolveAvatarStyleId(id)
  const definition = loadedStyles.get(styleId)
  if (!definition) {
    throw new Error(
      `Style d'avatar non chargé : "${styleId}" (appeler loadAvatarStyle avant le rendu).`
    )
  }
  return definition
}

/** Charge la définition d'un style (idempotent, mémoïsé en mémoire). */
export async function loadAvatarStyle(
  id: string | undefined
): Promise<AvatarStyleDefinition> {
  const styleId = resolveAvatarStyleId(id)
  const existing = loadedStyles.get(styleId)
  if (existing) return existing
  const definition = await STYLE_LOADERS[styleId]()
  loadedStyles.set(styleId, definition)
  return definition
}

/** Charge les styles **actifs** — éditeur d'avatar (sélecteur de styles + presets). */
export async function loadAllAvatarStyles(): Promise<void> {
  await Promise.all(AVATAR_STYLE_IDS.map((styleId) => loadAvatarStyle(styleId)))
}

/** Preset de « Réinitialiser », `style` inclus seulement si ≠ défaut. */
export function defaultOptionsFor(id: AvatarStyleId): AvatarOptions {
  const { defaults } = getAvatarStyle(id)
  return id === DEFAULT_AVATAR_STYLE
    ? { ...defaults }
    : { ...defaults, style: id }
}
