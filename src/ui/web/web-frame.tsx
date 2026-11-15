import { AppleLogoIcon, GooglePlayLogoIcon, QrCodeIcon } from '@phosphor-icons/react'
import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Logo } from '../brand/logo'
import { cn } from '../lib/cn'
import { AdSlot } from '../primitives/ad-slot'
import { buttonStyles } from '../primitives/button'
import { StoreButtons, type StoreLinks } from '../site/store-buttons'

/** Écran de l'iPhone Duo ouvert, en points (`DEVICES['iphone-duo-open']` du lab) : la taille exacte du cadre web. */
export const WEB_FRAME = { width: 626, height: 890, radius: 36 } as const
/** Sous cette largeur (web compact), l'app prend tout l'écran, sans cadre. */
const FRAMED_FROM = 640
/** Marge au-dessus et au-dessous du cadre. */
const FRAME_MARGIN = 24
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
 * Cadre de l'app web (D16, révisée le 2026-11-15) : Joutio n'a pas de composition grand écran. Sous 640 px (web
 * compact), l'app prend tout l'écran. Au-delà, elle s'affiche exactement comme sur l'iPhone Duo ouvert : un écran de
 * **626 × 890**, coins arrondis, centré sur le fond `canvas`, et **réduit en bloc** quand la fenêtre est moins haute
 * (`transform: scale`, mise en page inchangée : un portable en 1 366 × 768 voit le même écran, à ~0,8). La marque
 * n'occupe les marges que lorsqu'elles ont la place : logo, accroche et publicité à gauche, invitation à installer l'app
 * à droite, compactes de 1 024 à 1 279 px, larges au-delà. L'écran est le conteneur des tailles fluides (`cqw`) et des
 * feuilles, dialogues et toasts. Les bascules suivent la largeur du cadre (`@container/web`), pas la fenêtre. L'arbre
 * est le même avec ou sans cadre : l'app n'est jamais remontée au redimensionnement.
 */
export function WebFrame({ stores, tagline = 'Le quiz en duel, sur tous les sujets.', qrSrc, ads = false, className, children }: WebFrameProps) {
  const [root, { width, height }] = useSize()
  const framed = width >= FRAMED_FROM
  const scale = framed ? Math.min(1, Math.max(0.1, (height - 2 * FRAME_MARGIN) / WEB_FRAME.height)) : 1
  const showAd = ads && height >= AD_MIN_HEIGHT
  const aside = cn('row-start-1 hidden min-w-0 content-center p-4 @min-[1280px]/web:p-10', framed && '@min-[1024px]/web:grid')
  return (
    <FrameScaleContext.Provider value={scale}>
      <div ref={root} className={cn('@container/web h-full w-full', className)}>
        {/* Une rangée à la hauteur du cadre (`minmax(0,1fr)`) : sans elle, la rangée grandissait avec le contenu en web compact. */}
        <div className={cn('grid h-full grid-rows-[minmax(0,1fr)]', framed ? 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center bg-jo-canvas' : 'grid-cols-[minmax(0,1fr)]')}>
          <aside className={cn(aside, 'col-start-1 justify-items-end text-right')}>
            <div className="grid max-w-[300px] justify-items-end gap-4">
              {/* Marges étroites sous 1 280 px : logo et accroche plus petits. */}
              <span className="@min-[1280px]/web:hidden">
                <Logo variant="lockup" size={36} />
              </span>
              <span className="hidden @min-[1280px]/web:block">
                <Logo variant="lockup" size={44} />
              </span>
              <p className="jo-type-headline m-0 text-balance text-jo-muted @min-[1280px]/web:hidden">{tagline}</p>
              <p className="jo-type-title-2 m-0 hidden text-balance text-jo-muted @min-[1280px]/web:block">{tagline}</p>
              {/* 160 px de large dans les marges compactes, 300 px dans les larges. */}
              {showAd && <AdSlot format="skyscraper" className="mt-4 w-[160px] text-left @min-[1280px]/web:w-[300px]" />}
            </div>
          </aside>
          {/* Emplacement à la taille réduite : la grille et les marges voient la place réelle du cadre. */}
          <div className={cn('relative row-start-1 min-h-0 min-w-0', framed ? 'col-start-2' : 'col-start-1 h-full overflow-hidden')} style={framed ? { width: WEB_FRAME.width * scale, height: WEB_FRAME.height * scale } : undefined}>
            <div
              className={cn('relative h-full min-w-0 overflow-hidden bg-jo-bg [container-type:inline-size]', framed && 'absolute top-0 left-0 origin-top-left border border-jo-border shadow-jo')}
              style={framed ? { width: WEB_FRAME.width, height: WEB_FRAME.height, borderRadius: WEB_FRAME.radius, transform: scale < 1 ? `scale(${scale})` : undefined } : undefined}
            >
              {children}
            </div>
          </div>
          <aside className={cn(aside, 'col-start-3 justify-items-start')} aria-label="Installer l'app">
            <div className="grid max-w-[280px] gap-4">
              <p className="jo-type-headline m-0">Joue aussi sur mobile</p>
              {qrSrc ? (
                <img src={qrSrc} alt="QR code vers l'app Joutio" className="size-28 rounded-jo-md bg-white p-2 @min-[1280px]/web:size-36" />
              ) : (
                <span role="img" aria-label="QR code vers l'app Joutio" className="grid size-28 place-items-center @min-[1280px]/web:size-36 rounded-jo-md bg-jo-surface text-jo-text ring-1 ring-jo-border">
                  <QrCodeIcon aria-hidden className="size-20 @min-[1280px]/web:size-24" />
                </span>
              )}
              <p className="jo-type-caption m-0 text-jo-muted">Scanne avec ton téléphone, ou télécharge l'app.</p>
              <span className="hidden @min-[1280px]/web:block">
                <StoreButtons links={stores} />
              </span>
              {/* Marges étroites : boutons compacts, empilés, même hiérarchie (`filled` neutre). */}
              <div className="grid gap-2 @min-[1280px]/web:hidden">
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
  )
}
