import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import { cn } from "cn"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarDataUri } from "@/shared/avatar/avatar"
import {
  isBaseAvatarConfig,
  parseAvatarConfig,
  type BaseAvatarOptions,
} from "@/shared/avatar/config"
import { DefaultAvatar } from "@/shared/components/default-avatar"
import { useEloRating } from "@/shared/elo/elo-rating-store"
import { eloTier } from "@/shared/elo/elo"
import {
  getLoadedAvatarStyle,
  loadAvatarStyle,
  resolveAvatarStyleId,
} from "@/shared/avatar/styles"

/** Taille à partir de laquelle l'avatar porte le cadre complet de son rang. */
const ELO_FRAME_MIN_SIZE = 40

/** Horloge commune : le délai négatif met en phase tous les cadres, quel que soit leur montage. */
const ELO_CLOCK = `-${Math.round(performance.now())}ms`

/**
 * Avatar joueur — rend l'avatar DiceBear configuré, sinon l'icône de base grise.
 *
 * Les styles non embarqués sont **chargés à la demande** (chunks séparés) : l'icône générique
 * (`AvatarFallback`) couvre le court intervalle de chargement, comme un `<img>` en cours de
 * résolution. Sans avatar personnalisé, on affiche l'avatar de base (jamais un Micah dérivé du
 * seed). Le compte supprimé utilise la même silhouette générique sur un fond gris.
 *
 * Toutes les caractéristiques visuelles (forme, fond, couleurs) proviennent
 * **de l'avatar lui-même** : rien n'est forcé par l'appelant. La présence
 * éventuelle est indiquée par `PresenceBadge`, jamais par une bordure.
 */
interface UserAvatarProps {
  name: string
  userId?: string
  avatarOptions?: string
  size?: number
  /** Remplit la taille du conteneur (100 %) — `size` ne sert plus qu'à la résolution/fallback. */
  fluid?: boolean
  /** Bordure Elo globale ; désactivée dans la topbar/sidebar, l'éditeur d'avatar et les salons. */
  eloFrame?: boolean
  /** Rating déjà connu (ex. entrée de classement) : évite le batch. */
  rating?: number | null
  provisional?: boolean
  /** Compte supprimé : silhouette générique sur fond gris, sans avatar personnalisé. */
  initialOnly?: boolean
  className?: string
}

/** Identité d'avatar (userId/options) pour transmettre l'avatar d'un joueur. */
export interface AvatarIdentity {
  userId?: string
  avatarOptions?: string
  /** Force l'avatar générique gris (compte supprimé). */
  initialOnly?: boolean
}

export function UserAvatar({
  name,
  userId,
  avatarOptions,
  size = 40,
  fluid,
  eloFrame = true,
  rating,
  provisional = false,
  initialOnly = false,
  className,
}: UserAvatarProps) {
  const config = useMemo(
    () => parseAvatarConfig(avatarOptions),
    [avatarOptions]
  )
  const baseConfig = isBaseAvatarConfig(config) ? config : undefined
  const dicebearOptions =
    config && !isBaseAvatarConfig(config) ? config : undefined
  const seed = userId ?? name
  const styleId = resolveAvatarStyleId(dicebearOptions?.style)
  const fetched = useEloRating(eloFrame && rating == null ? userId : undefined)
  const elo = eloFrame
    ? rating != null
      ? { rating, provisional }
      : fetched
    : null
  const tier = elo ? (elo.provisional ? "PROVISIONAL" : eloTier(elo.rating)) : null
  // Cadre complet dès 40 px, anneau plein en dessous (épaisseur proportionnelle en `cqw`).
  const framed = tier !== null && (fluid || size >= ELO_FRAME_MIN_SIZE)
  const ring = tier !== null && !framed

  // Style non embarqué : chargé au premier rendu, re-rendu une fois prêt.
  const [styleReady, setStyleReady] = useState(
    () => getLoadedAvatarStyle(styleId) !== undefined
  )
  useEffect(() => {
    if (styleReady) return
    let cancelled = false
    void loadAvatarStyle(styleId).then(() => {
      if (!cancelled) setStyleReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [styleId, styleReady])

  const src = useMemo(
    () =>
      !initialOnly && styleReady && dicebearOptions
        ? avatarDataUri(dicebearOptions, size * 2, seed)
        : undefined,
    [dicebearOptions, initialOnly, styleReady, size, seed]
  )

  const wrapperStyle = {
    width: fluid ? "100%" : size,
    height: fluid ? "100%" : size,
    containerType: "inline-size",
    "--elo-clock": ELO_CLOCK,
  } as CSSProperties

  const avatarStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    outline: ring ? "var(--elo-ring) solid" : undefined,
    outlineWidth: ring ? "clamp(1px, 5cqw, 4px)" : undefined,
    outlineOffset: ring ? 0 : undefined,
  }

  return (
    <span
      data-elo-tier={tier ?? undefined}
      className={cn("relative inline-flex shrink-0 rounded-full", className)}
      style={wrapperStyle}
    >
      {framed && <span aria-hidden className="qu-elo-frame" />}
      <Avatar
        className={cn(
          "size-full overflow-hidden rounded-full bg-transparent after:hidden",
          framed && "qu-elo-portrait"
        )}
        style={avatarStyle}
      >
        <AvatarImage src={src} alt="" className="rounded-full" />
        <AvatarFallback className="size-full p-0 text-muted-foreground">
          <DefaultAvatar
            backgroundColor={
              initialOnly
                ? "gray"
                : (baseConfig as BaseAvatarOptions | undefined)?.backgroundColor
            }
          />
        </AvatarFallback>
      </Avatar>
    </span>
  )
}
