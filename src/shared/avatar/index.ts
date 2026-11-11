import { useEffect, useState } from 'react'
import { dicebearSvg } from './render'
import { isAvatarStyleLoaded, loadAvatarStyle } from './styles'
import { BACKGROUND_COLORS } from './styles/palettes'

/**
 * Avatars des joueurs (options compactes `avatarOptions` partagées avec le mobile et le lab, graine = `userId`),
 * rendus en SVG DiceBear et passés à `Avatar` en data URI. Sans options : initiales.
 */
type AvatarConfig = { style?: string } & Record<string, string | undefined>

/** Silhouette de l'avatar de base (256 × 256), comme le lab et le mobile. */
const BASE_ICON = 'M128 136a48 48 0 1 0-48-48 48 48 0 0 0 48 48Zm0 24c-44 0-82 22-92 56a100 100 0 0 0 184 0c-10-34-48-56-92-56Z'
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
const baseSvg = (background: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="${background}"/><path d="${BASE_ICON}" fill="#3f3f46"/></svg>`

/** Joueur porteur de ses options d'avatar (`UserRefView`, `LeaderboardEntryView`, `MeView`…). */
export type AvatarOwner = { userId: string; avatarOptions?: string | null }

/** Data URI de l'avatar si son style est chargé ; `null` sans options ; `undefined` tant que le style charge. */
function render(owner: AvatarOwner): string | null | undefined {
  const config = parse(owner.avatarOptions)
  if (!config) return null
  const key = `${owner.userId}:${owner.avatarOptions}`
  const cached = cache.get(key)
  if (cached) return cached
  if (config.style !== 'base' && !isAvatarStyleLoaded(config.style)) return undefined
  const svg = config.style === 'base' ? baseSvg(config.backgroundColor ?? BACKGROUND_COLORS[0] ?? '#e4e4e7') : dicebearSvg(config as never, owner.userId)
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
