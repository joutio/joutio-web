import type { AvatarOptions, AvatarStyleDefinition, AvatarStyleId } from './types'

export type { AvatarOptions, AvatarStyleDefinition, AvatarStyleGroup, AvatarStyleId, AvatarStyleSection } from './types'
export { humanizeVariant, NONE_LABEL_KEY } from './labels'

export const AVATAR_STYLE_IDS: AvatarStyleId[] = ['micah', 'lorelei', 'notionists']

/** Micah reste le style par défaut (options persistées sans `style`), comme sur le web. */
export const DEFAULT_AVATAR_STYLE: AvatarStyleId = 'micah'

/**
 * Définitions chargées à la demande par `import()` (chunks Vite) : les JSON de Lorelei (~115 Ko) et Notionists
 * (~364 Ko) ne sont téléchargés qu'au premier avatar de ce style. `getAvatarStyle` lit un style déjà chargé ;
 * `loadAvatarStyle` le charge.
 */
const LOADERS: Record<AvatarStyleId, () => Promise<AvatarStyleDefinition>> = {
  micah: () => import('./micah').then((module) => module.micahStyle),
  lorelei: () => import('./lorelei').then((module) => module.loreleiStyle),
  notionists: () => import('./notionists').then((module) => module.notionistsStyle),
}
const loaded = new Map<AvatarStyleId, AvatarStyleDefinition>()
const pending = new Map<AvatarStyleId, Promise<AvatarStyleDefinition>>()

export function isAvatarStyleId(value: unknown): value is AvatarStyleId {
  return typeof value === 'string' && (AVATAR_STYLE_IDS as readonly string[]).includes(value)
}

export const resolveAvatarStyleId = (id: string | undefined): AvatarStyleId => (isAvatarStyleId(id) ? id : DEFAULT_AVATAR_STYLE)

export const isAvatarStyleLoaded = (id: string | undefined) => loaded.has(resolveAvatarStyleId(id))

export function loadAvatarStyle(id: string | undefined): Promise<AvatarStyleDefinition> {
  const styleId = resolveAvatarStyleId(id)
  const existing = loaded.get(styleId)
  if (existing) return Promise.resolve(existing)
  let promise = pending.get(styleId)
  if (!promise) {
    promise = LOADERS[styleId]().then((definition) => {
      loaded.set(styleId, definition)
      pending.delete(styleId)
      return definition
    })
    pending.set(styleId, promise)
  }
  return promise
}

/** Style déjà chargé (`loadAvatarStyle`) ; une erreur sinon. */
export function getAvatarStyle(id: string | undefined): AvatarStyleDefinition {
  const definition = loaded.get(resolveAvatarStyleId(id))
  if (!definition) throw new Error(`Style d'avatar non chargé : ${resolveAvatarStyleId(id)}`)
  return definition
}

/** Preset de « Réinitialiser » d'un style, `style` compris. */
export function defaultOptionsFor(id: AvatarStyleId): AvatarOptions {
  return { ...getAvatarStyle(id).defaults, style: id }
}
