import { CaretLeftIcon } from '@phosphor-icons/react'
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { PremiumBadge } from '../brand/premium-badge'
import { useBannerPresence, useGlobalBanner } from '../primitives/banner'
import { PlayerName } from '../primitives/player-name'
import { IconButton } from '../primitives/icon-button'

/** Hauteur de la zone image, safe area comprise. */
const HERO_HEIGHT = 320
const BAR_HEIGHT = 52

/** Ramène le scroll au point où le bloc `sticky` se colle, s'il est dépassé. */
const ParallaxScrollContext = createContext<(() => void) | null>(null)

export const useParallaxScrollReset = () => useContext(ParallaxScrollContext)

export type ParallaxScreenProps = {
  heroHeight?: number
  /** Absente : fond uni, pour une bannière facultative. */
  image?: string
  title: string
  /** Joueur Premium (Profil, Fiche joueur) : `PremiumBadge` après le titre, sur l'image et dans la barre compacte. */
  premium?: boolean
  /** Au-dessus du titre, par exemple la catégorie. */
  eyebrow?: ReactNode
  /** Titre centré sur l'image, pour une identité plutôt qu'un sujet. */
  centered?: boolean
  /** Titre de la barre compacte à gauche, pour laisser la place à plusieurs actions. */
  barTitleStart?: boolean
  /** `false` sur un onglet, qui n'a pas d'écran précédent. */
  back?: boolean
  onBack?: () => void
  /** Actions de droite, toujours visibles sur l'image comme sur la barre. */
  right?: ReactNode
  /** Sous l'image : défile avec elle. */
  intro?: ReactNode
  /** Reste collé sous la barre compacte, typiquement des onglets. */
  sticky?: ReactNode
  /** Bouton flottant, posé en bas à droite du contenu. */
  floating?: ReactNode
  /** Actions principales, fixes au-dessus de la navigation. */
  bottomBar?: ReactNode
  bottomNav?: ReactNode
  overlay?: ReactNode
  /**
   * `Banner` tout en haut, au-dessus de l'image : elle porte la safe area haute, l'image et la barre compacte
   * commencent sous elle.
   */
  banner?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Écran à en-tête image : l'image glisse en parallaxe et se replie en barre compacte, le bloc `sticky`
 * reste accroché dessous. `right` garde les mêmes boutons sur l'image et sur la barre. Reprend le « Details Header » de sticky-parallax-header.
 */
export function ParallaxScreen({ heroHeight = HERO_HEIGHT, image, title, premium = false, eyebrow, centered = false, barTitleStart = false, back = true, onBack, right, intro, sticky, floating, bottomBar, bottomNav, overlay, banner: own, className, children }: ParallaxScreenProps) {
  const global = useGlobalBanner()
  const banner = useBannerPresence(global ?? own)
  const root = useRef<HTMLDivElement>(null)
  const main = useRef<HTMLElement>(null)
  const stickyBlock = useRef<HTMLDivElement>(null)
  const stickyStart = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)

  // Le contenu remplit juste l'espace sous le bloc collé : assez pour replier, sans scroll à vide.
  useLayoutEffect(() => {
    const scroller = main.current
    const block = stickyBlock.current
    const area = content.current
    if (!scroller || !block || !area) return
    const update = () => {
      const top = Number.parseFloat(getComputedStyle(block).top) || 0
      area.style.minHeight = `${scroller.clientHeight - top - block.offsetHeight}px`
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(scroller)
    observer.observe(block)
    return () => observer.disconnect()
  }, [])

  const resetScroll = useCallback(() => {
    const scroller = main.current
    const block = stickyBlock.current
    if (!scroller || !block) return
    const top = Number.parseFloat(getComputedStyle(block).top) || 0
    scroller.scrollTop = Math.min(scroller.scrollTop, block.offsetTop - top)
  }, [])
  const context = useMemo(() => resetScroll, [resetScroll])

  const onScroll = (event: React.UIEvent<HTMLElement>) => {
    const distance = heroHeight - BAR_HEIGHT
    const top = event.currentTarget.scrollTop
    const block = stickyBlock.current
    const bar = block ? Number.parseFloat(getComputedStyle(block).top) || 0 : 0
    const distanceToDock = Math.max(0, (stickyStart.current?.offsetTop ?? 0) - bar)
    const dock = block ? Math.max(0, Math.min(1, 1 - (distanceToDock - top) / Math.min(8, distanceToDock || 8))) : 0
    root.current?.style.setProperty('--jo-tabs-dock', String(dock))
    root.current?.style.setProperty('--jo-header-edge', String(Math.min(1, Math.max(0, top / distance)) * 1.3 >= 1 ? 1 : 0))
    root.current?.style.setProperty('--jo-parallax-scroll', `${top}px`)
    root.current?.style.setProperty('--jo-parallax-progress', `${Math.min(1, Math.max(0, top / distance))}`)
  }

  const barHeight = `calc(var(--jo-safe-top, 0px) + ${BAR_HEIGHT}px)`
  return (
    <div ref={root} className={cn('jo-parallax relative flex h-full flex-col overflow-hidden bg-jo-bg text-jo-text', className)}>
      {banner}
      {/* Sous une bande, la safe area haute est déjà prise : l'image et la barre compacte repartent de 0. */}
      <div className="relative flex min-h-0 flex-1 flex-col" style={banner ? ({ '--jo-safe-top': '0px' } as React.CSSProperties) : undefined}>
      <div className="relative min-h-0 flex-1">
      {/* Sans `overscroll-contain` (écart web du 2026-11-12) : en haut du défilement, le geste rejoint la page et le
          navigateur mobile peut rafraîchir, comme sur les écrans `Screen` (Fiche sujet, Profil, Fiche joueur). */}
      <main ref={main} onScroll={onScroll} className="jo-no-scrollbar h-full overflow-y-auto">
        <div className="relative overflow-hidden bg-jo-surface" style={{ height: heroHeight }}>
          {image && <img src={image} alt="" className="jo-parallax-image absolute inset-0 size-full object-cover" />}
          <div className="absolute inset-0 bg-linear-to-t from-jo-bg via-jo-bg/40 to-transparent" />
          {/* La barre d'état doit rester lisible : la bannière peut être n'importe quelle image. */}
          <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-jo-bg/80 to-transparent" />
          {/* Identité centrée (Profil, Fiche joueur) : 24 px entre l'avatar, dont le cadre de rang déborde, et le pseudonyme. */}
          <div className={cn('jo-parallax-title absolute inset-x-4 bottom-3 grid', centered ? 'gap-6 justify-items-center text-center' : 'gap-1')}>
            {eyebrow && <div className="jo-type-caption font-semibold">{eyebrow}</div>}
            <h1 className={cn('jo-type-title-1 text-balance', premium && 'flex items-center gap-1', premium && centered && 'justify-center')}>
              {title}
              {premium && <PremiumBadge size={22} />}
            </h1>
          </div>
        </div>
        {intro && <div className="px-4 pt-1 pb-2">{intro}</div>}
        {sticky && (
          <>
            <div ref={stickyStart} aria-hidden />
            <div ref={stickyBlock} className="sticky z-10 bg-jo-bg px-4 pt-2 pb-2" style={{ top: barHeight }}>
              {sticky}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-jo-border" style={{ opacity: 'calc(var(--jo-header-edge, 0) * var(--jo-tabs-dock, 0))' }} />
            </div>
          </>
        )}
        <div ref={content}>
          <ParallaxScrollContext.Provider value={context}>{children}</ParallaxScrollContext.Provider>
        </div>
      </main>
      {floating && <div className="absolute right-4 bottom-4 z-10">{floating}</div>}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20" style={{ height: barHeight }}>
        <div className="jo-parallax-bar absolute inset-0 bg-jo-bg" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-jo-border" style={{ opacity: 'calc(var(--jo-header-edge, 0) * (1 - var(--jo-tabs-dock, 0)))' }} />
        <div className={cn('jo-parallax-buttons absolute inset-x-0 bottom-0 grid h-[52px] items-center gap-2 px-3', barTitleStart ? 'grid-cols-[auto_minmax(0,1fr)_auto]' : 'grid-cols-[minmax(44px,1fr)_minmax(0,auto)_minmax(max-content,1fr)]')}>
          <span className="pointer-events-auto justify-self-start">{back && <IconButton icon={CaretLeftIcon} label="Retour" media onClick={onBack} />}</span>
          {premium ? (
            <PlayerName name={title} premium badgeSize={18} className="jo-parallax-bar-title jo-type-headline max-w-[220px]" />
          ) : (
            <strong className="jo-parallax-bar-title jo-type-headline max-w-[220px] truncate">{title}</strong>
          )}
          <span className="pointer-events-auto flex gap-2 justify-self-end">{right}</span>
        </div>
      </div>
      </div>
      {bottomBar && <div className={cn('flex-none border-t border-jo-border bg-jo-bg px-4 pt-2', bottomNav ? 'pb-2' : 'pb-[calc(var(--jo-safe-bottom,0px)+8px)]')}>{bottomBar}</div>}
      {bottomNav}
      {overlay}
    </div>
  )
}
