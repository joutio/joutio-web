import { useEffect, useState } from 'react'
import { dicebearSvg } from './render'
import { isAvatarStyleLoaded, loadAvatarStyle } from './styles'

/**
 * Avatars des joueurs (options compactes `avatarOptions` partagées avec le mobile et le lab, graine = `userId`),
 * rendus en SVG DiceBear et passés à `Avatar` en data URI. Sans options ou avec le style `base` : les initiales du
 * Profil, sans aucun réglage (`primitives.md` § Identité d'un joueur, 2026-11-12) ; l'ancien fond coloré est ignoré.
 */
type AvatarConfig = { style?: string } & Record<string, string | undefined>

const CACHE_LIMIT = 600
const cache = new Map<string, string>()

function parse(json: string | null | undefined): AvatarConfig | null {
  if (!json) return null
  try {
    const parsed: unknown = JSON.parse(json)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as AvatarConfig) : null
  } catch {
    return null
  }
}

const dataUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

/** Joueur porteur de ses options d'avatar (`UserRefView`, `LeaderboardEntryView`, `MeView`…). */
export type AvatarOwner = { userId: string; avatarOptions?: string | null }

/** Data URI de l'avatar si son style est chargé ; `null` : initiales ; `undefined` tant que le style charge. */
function render(owner: AvatarOwner): string | null | undefined {
  const config = parse(owner.avatarOptions)
  if (!config || config.style === 'base') return null
  const key = `${owner.userId}:${owner.avatarOptions}`
  const cached = cache.get(key)
  if (cached) return cached
  if (!isAvatarStyleLoaded(config.style)) return undefined
  const svg = dicebearSvg(config as never, owner.userId)
  if (cache.size >= CACHE_LIMIT) cache.clear()
  const uri = dataUri(svg)
  cache.set(key, uri)
  return uri
}

/** Avatar d'un joueur à partir de **ses** options ; `undefined` : initiales (ou style en cours de chargement). */
export function useUserAvatar(owner: AvatarOwner | null | undefined): string | undefined {
  const [, setLoaded] = useState(0)
  const result = owner ? render(owner) : null
  const style = owner ? parse(owner.avatarOptions)?.style : undefined
  useEffect(() => {
    if (result !== undefined) return
    let active = true
    void loadAvatarStyle(style).then(() => active && setLoaded((count) => count + 1))
    return () => {
      active = false
    }
  }, [result, style])
  return result ?? undefined
}

/** Options d'avatar éditées (style + attributs), sérialisées telles quelles dans `avatarOptions`. */
export type AvatarDraft = { style: string } & Record<string, string | undefined>

/** Lit les options d'un joueur ; sans options, l'avatar de base (initiales, sans réglage). */
export function parseAvatarOptions(json: string | null | undefined): AvatarDraft {
  const config = parse(json)
  if (!config || config.style === 'base') return { style: 'base' }
  return { ...config, style: config.style ?? 'micah' } as AvatarDraft
}

/** Aperçu synchrone (éditeur d'avatar) ; `undefined` : initiales, ou style pas encore chargé (`loadAvatarStyle`). */
export function previewAvatar(userId: string, draft: AvatarDraft): string | undefined {
  return render({ userId, avatarOptions: JSON.stringify(draft) }) ?? undefined
}

export { loadAvatarStyle } from './styles'
export { BACKGROUND_COLORS, HAIR_COLORS } from './styles/palettes'
