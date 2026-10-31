import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { cn } from "cn"
import rubanArgentUrl from "@/assets/ruban/ruban-argent.svg"
import rubanBronzeUrl from "@/assets/ruban/ruban-bronze.svg"
import rubanDiamantUrl from "@/assets/ruban/ruban-diamant.svg"
import rubanEmeraudeUrl from "@/assets/ruban/ruban-emeraude.svg"
import rubanFerUrl from "@/assets/ruban/ruban-fer.svg"
import rubanOrUrl from "@/assets/ruban/ruban-or.svg"
import rubanPlatineUrl from "@/assets/ruban/ruban-platine.svg"
import type { Rank } from "../domain/progression"
import {
  RIBBON_INK,
  RIBBON_TITLE_FONT,
  RIBBON_TITLE_SIZE,
  RIBBON_TITLE_X,
  RIBBON_TITLE_Y,
  RIBBON_VIEWBOX,
  fitRibbonTitle,
} from "../domain/ribbon"

/** Assets de ruban par rang (copies de `product/ruban/`, texte baké retiré). */
const RIBBON_ASSETS: Record<Rank, string> = {
  FER: rubanFerUrl,
  BRONZE: rubanBronzeUrl,
  ARGENT: rubanArgentUrl,
  OR: rubanOrUrl,
  PLATINE: rubanPlatineUrl,
  EMERAUDE: rubanEmeraudeUrl,
  DIAMANT: rubanDiamantUrl,
}

interface TitleRibbonProps {
  /** Libellé du titre porté (déjà composé : nom thématique ou « Palier · Sujet »). */
  label: string
  /** Rang du titre : choisit le ruban métallique et l'encre du libellé. */
  rank: Rank
  className?: string
}

/**
 * Ruban du **titre porté** — bannière métallique du rang (`Fer` → `Diamant`) avec le titre
 * **inséré au centre du bandeau**, à l'image du bandeau de récompense de la maquette
 * `img_11.png`. Affiché sous les informations du joueur (bandeau de profil) quand un titre
 * thématique est porté.
 *
 * **Échelle calée sur l'interface** : 18 rem (288 px) de large ⇒ ~73 px de haut — le ruban reste
 * sous les informations et ne domine ni l'avatar ni les actions. Le bandeau fait ~33 px, le titre
 * ~18 px.
 *
 * **Lisibilité** : le libellé est composé en **Inter** (police d'interface), **graisse 800** —
 * le rendu « gravé » du didone a été abandonné : aux petites tailles du ruban, ses déliés
 * n'étaient pas assez lisibles. Aucun liseré ni relief, le contraste vient de l'encre sombre sur
 * le métal.
 *
 * L'overlay texte partage le `viewBox` de l'asset : le titre vit dans le repère du ruban (aucune
 * déformation possible à l'affichage, à toutes les tailles d'écran). Un libellé trop large est
 * d'abord réduit (corps), puis comprimé (`textLength` `spacingAndGlyphs`) — jamais étiré quand il
 * tient déjà.
 *
 * La mesure porte sur un nœud **libre** (jamais contraint par `textLength`) : la décision
 * d'ajustement reste stable d'un rendu à l'autre.
 */
export function TitleRibbon({ label, rank, className }: TitleRibbonProps) {
  const measureRef = useRef<SVGTextElement>(null)
  /** Largeur naturelle du libellé **au corps de base** (unités du viewBox), avant mesure. */
  const [width, setWidth] = useState<number | null>(null)

  const measure = useCallback((size: number) => {
    const node = measureRef.current
    if (!node || typeof node.getComputedTextLength !== "function") return
    // `getComputedTextLength` est exprimé dans le repère de l'asset : on normalise au corps de
    // base pour que la mesure ne dépende pas du corps courant (et donc ne redéclenche pas
    // d'ajustement en boucle).
    const length = (node.getComputedTextLength() * RIBBON_TITLE_SIZE) / size
    setWidth((current) =>
      current !== null && Math.abs(current - length) < 0.5 ? current : length
    )
  }, [])

  const fitted = fitRibbonTitle(width, label)
  // Repli Or pour un rang inconnu d'une version future : le ruban ne casse jamais.
  const asset = RIBBON_ASSETS[rank] ?? RIBBON_ASSETS.OR
  const ink = RIBBON_INK[rank] ?? RIBBON_INK.OR

  // Mesure avant peinture : le titre n'est jamais peint à la mauvaise taille.
  useLayoutEffect(() => {
    measure(fitted.fontSize)
  }, [measure, label, fitted.fontSize])

  // Re-mesure quand la police est prête : la première mesure peut porter sur la police de repli.
  useEffect(() => {
    const fonts = document.fonts as FontFaceSet | undefined
    if (!fonts || typeof fonts.ready !== "object") return
    let cancelled = false
    void fonts.ready.then(() => {
      if (!cancelled) measure(fitted.fontSize)
    })
    return () => {
      cancelled = true
    }
  }, [measure, label, fitted.fontSize])

  return (
    <span
      className={cn(
        "relative inline-block w-full max-w-[18rem] align-top",
        className
      )}
    >
      <img
        src={asset}
        alt=""
        aria-hidden
        data-rank={rank}
        className="block h-auto w-full"
      />
      <svg
        viewBox={RIBBON_VIEWBOX}
        role="img"
        aria-label={label}
        className="absolute inset-0 h-full w-full"
        pointerEvents="none"
      >
        <text
          fontFamily={RIBBON_TITLE_FONT}
          fill={ink.fill}
          fontWeight={800}
          fontSize={fitted.fontSize}
          x={RIBBON_TITLE_X}
          y={RIBBON_TITLE_Y}
          textAnchor="middle"
          dominantBaseline="central"
          textLength={fitted.textLength ?? undefined}
          lengthAdjust={fitted.textLength ? "spacingAndGlyphs" : undefined}
          aria-hidden
        >
          {label}
        </text>
        {/* Mesure libre du libellé (même corps, même police) — jamais contrainte par `textLength`. */}
        <text
          ref={measureRef}
          data-measure=""
          fontFamily={RIBBON_TITLE_FONT}
          fontWeight={800}
          fontSize={fitted.fontSize}
          x={0}
          y={0}
          opacity={0}
          aria-hidden
          pointerEvents="none"
        >
          {label}
        </text>
      </svg>
    </span>
  )
}
