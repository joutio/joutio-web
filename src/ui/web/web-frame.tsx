import { AppleLogoIcon, GooglePlayLogoIcon, QrCodeIcon } from '@phosphor-icons/react'
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Logo } from '../brand/logo'
import { cn } from '../lib/cn'
import { REGULAR_WIDTH, RegularContext } from '../lib/regular-width'
import { AdSlot } from '../primitives/ad-slot'
import { buttonStyles } from '../primitives/button'
import { StoreButtons, type StoreLinks } from '../site/store-buttons'

/**
 * Écran de l'iPhone Duo ouvert **en paysage**, en points (`DEVICES['iphone-duo-open']` du lab, tourné, 2026-11-16) : la
 * taille exacte du cadre web.
 */
export const WEB_FRAME = { width: 890, height: 626, radius: 20 } as const
/** Marge autour du cadre. */
const FRAME_MARGIN = 24
/** Sous cette largeur (le cadre et ses marges ne tiennent pas), l'app prend tout l'écran, sans cadre. */
const FRAMED_FROM = WEB_FRAME.width + 2 * FRAME_MARGIN
/** Écran de l'iPhone Duo ouvert **en portrait** : le cadre d'une fenêtre en portrait trop large pour un téléphone (tablette). */
export const WEB_FRAME_PORTRAIT = { width: 626, height: 890, radius: 20 } as const
/** Hauteur de fenêtre qu'il faut pour la publicité (600) sous le logo et l'accroche. */
const AD_MIN_HEIGHT = 840

const FrameScaleContext = createContext(1)

/**
 * Échelle du cadre web (1 hors cadre). Un geste qui déplace un élément selon le pointeur divise son delta par elle :
 * `clientX`/`clientY` sont à l'échelle de l'écran, la mise en page à celle du cadre.
 */
export function useFrameScale() {
  return useContext(FrameScaleContext)
}

export type WebFrameProps = {
  /** Liens des stores, à droite de la colonne. */
  stores: StoreLinks
  /** Accroche sous le logo, à gauche de la colonne. */
  tagline?: string
  /** Image du QR code vers l'app. Sans image, un emplacement réservé. */
  qrSrc?: string
  /** Publicité dans la marge gauche (≥ 1 024 px), sous la marque. Jamais pendant un duel ni pour un joueur Premium. */
  ads?: boolean
  className?: string
  children: ReactNode
}

/** Taille du conteneur, suivie au redimensionnement (0 avant la première mesure). */
function useSize() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setSize((current) => (current.width === element.clientWidth && current.height === element.clientHeight ? current : { width: element.clientWidth, height: element.clientHeight }))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

/**
 * Cadre de l'app web (D16, révisée le 2026-11-16) : Joutio n'a pas de composition grand écran. Sous 938 px, l'app
 * prend tout l'écran. Au-delà, elle s'affiche exactement comme sur l'iPhone Duo ouvert **en paysage** : un écran de
 * **890 × 626**, coins arrondis, centré sur le fond `canvas`, et **réduit en bloc** quand la fenêtre est moins haute
 * (`transform: scale`, mise en page inchangée). La marque n'occupe les marges que lorsqu'elles ont la place : logo,
 * accroche et publicité à gauche, invitation à installer l'app à droite, compactes de 1 280 à 1 439 px, larges au-delà.
 * Plus étroite, une fenêtre en portrait d'au moins 674 px (tablette) affiche le Duo ouvert **en portrait**, 626 × 890,
 * centré et réduit de même, sans marque. Largeur « regular » (cadre, ou ≥ 700 px en paysage) : fournie par `RegularContext` et
 * `data-jo-regular` (rail de navigation, écrans en deux volets). L'écran est le conteneur des tailles fluides (`cqw`) et des
 * feuilles, dialogues et toasts. Les bascules suivent la largeur du cadre (`@container/web`), pas la fenêtre. L'arbre
 * est le même avec ou sans cadre : l'app n'est jamais remontée au redimensionnement.
 */
export function WebFrame({ stores, tagline = 'Le quiz en duel, sur tous les sujets.', qrSrc, ads = false, className, children }: WebFrameProps) {
  const [root, { width, height }] = useSize()
  // Cadre paysage (890 × 626) dès que la fenêtre le contient en largeur, avec la marque dans les marges.
  const landscape = width >= FRAMED_FROM
  // Largeur « regular » : le cadre paysage, ou une fenêtre plein écran d'au moins 700 px et plus large que haute.
  const regular = landscape || (width >= REGULAR_WIDTH && width > height)
  // Fenêtre en portrait trop large pour un téléphone (tablette) : le Duo ouvert en portrait (626 × 890, 2026-11-16).
  const portrait = !landscape && !regular && width >= WEB_FRAME_PORTRAIT.width + 2 * FRAME_MARGIN
  const frame = landscape ? WEB_FRAME : portrait ? WEB_FRAME_PORTRAIT : undefined
  const framed = Boolean(frame)
  const scale = frame ? Math.min(1, Math.max(0.1, (height - 2 * FRAME_MARGIN) / frame.height)) : 1
  const showAd = ads && height >= AD_MIN_HEIGHT
  const aside = cn('row-start-1 hidden min-w-0 content-center p-4 @min-[1440px]/web:p-10', landscape && '@min-[1280px]/web:grid')
  return (
    <RegularContext.Provider value={regular}>
    <FrameScaleContext.Provider value={scale}>
      <div ref={root} className={cn('@container/web h-full w-full', className)}>
        {/* Une rangée à la hauteur du cadre (`minmax(0,1fr)`) : sans elle, la rangée grandissait avec le contenu en web compact. */}
        <div className={cn('grid h-full grid-rows-[minmax(0,1fr)]', framed ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center bg-jo-canvas' : 'grid-cols-[minmax(0,1fr)]')}>
          <aside className={cn(aside, 'col-start-1 justify-items-end text-right')}>
            <div className="grid max-w-[300px] justify-items-end gap-4">
              {/* Marges étroites sous 1 440 px : logo et accroche plus petits. */}
              <span className="@min-[1440px]/web:hidden">
                <Logo variant="lockup" size={36} />
              </span>
              <span className="hidden @min-[1440px]/web:block">
                <Logo variant="lockup" size={44} />
              </span>
              <p className="jo-type-headline m-0 text-balance text-jo-muted @min-[1440px]/web:hidden">{tagline}</p>
              <p className="jo-type-title-2 m-0 hidden text-balance text-jo-muted @min-[1440px]/web:block">{tagline}</p>
              {/* 160 × 600 dans les deux marges : à 1 440 px, il reste ~195 px, trop peu pour le 300 px. */}
              {showAd && <AdSlot format="skyscraper" className="mt-4 w-[160px] text-left" />}
            </div>
          </aside>
          {/* Emplacement à la taille réduite : la grille et les marges voient la place réelle du cadre. */}
          <div className={cn('relative row-start-1 min-h-0 min-w-0', framed ? 'col-start-2' : 'col-start-1 h-full overflow-hidden')} style={frame ? { width: frame.width * scale, height: frame.height * scale } : undefined}>
            <div
              data-jo-regular={regular || undefined}
              className={cn('relative h-full min-w-0 overflow-hidden bg-jo-bg [container-type:inline-size]', framed && 'absolute top-0 left-0 origin-top-left shadow-jo outline outline-jo-border')}
              style={frame ? { width: frame.width, height: frame.height, borderRadius: frame.radius, transform: scale < 1 ? `scale(${scale})` : undefined } : undefined}
            >
              {children}
            </div>
          </div>
          <aside className={cn(aside, 'col-start-3 justify-items-start')} aria-label="Installer l'app">
            <div className="grid max-w-[280px] gap-4">
              <p className="jo-type-headline m-0">Joue aussi sur mobile</p>
              {qrSrc ? (
                <img src={qrSrc} alt="QR code vers l'app Joutio" className="size-28 rounded-jo-md bg-white p-2 @min-[1440px]/web:size-36" />
              ) : (
                <span role="img" aria-label="QR code vers l'app Joutio" className="grid size-28 place-items-center @min-[1440px]/web:size-36 rounded-jo-md bg-jo-surface text-jo-text ring-1 ring-jo-border">
                  <QrCodeIcon aria-hidden className="size-20 @min-[1440px]/web:size-24" />
                </span>
              )}
              <p className="jo-type-caption m-0 text-jo-muted">Scanne avec ton téléphone, ou télécharge l'app.</p>
              <span className="hidden @min-[1440px]/web:block">
                {/* Toujours empilés : côte à côte, ils débordaient de la marge. */}
                <StoreButtons links={stores} className="@xl:grid-flow-row @xl:auto-cols-auto" />
              </span>
              {/* Marges étroites : boutons compacts, empilés, même hiérarchie (`filled` neutre). */}
              <div className="grid gap-2 @min-[1440px]/web:hidden">
                <a href={stores.appStore} className={cn(buttonStyles({ variant: 'filled', tone: 'neutral', size: 'M', full: true }), 'gap-2 no-underline')}>
                  <AppleLogoIcon size={20} weight="fill" aria-hidden />
                  App Store
                </a>
                <a href={stores.googlePlay} className={cn(buttonStyles({ variant: 'filled', tone: 'neutral', size: 'M', full: true }), 'gap-2 no-underline')}>
                  <GooglePlayLogoIcon size={18} weight="fill" aria-hidden />
                  Google Play
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </FrameScaleContext.Provider>
    </RegularContext.Provider>
  )
}
