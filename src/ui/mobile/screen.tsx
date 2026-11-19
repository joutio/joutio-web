import { useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { setStyleVar } from '../lib/style-var'
import { useBannerPresence, useGlobalBanner } from '../primitives/banner'

export type ScreenProps = {
  /**
   * `Banner` (connexion, partie en cours, ouvrir dans l'app) : tout en haut, au-dessus du header qu'elle pousse vers le
   * bas. Elle remonte sous la barre d'état et porte elle-même la safe area haute.
   */
  banner?: ReactNode
  header?: ReactNode
  /** Barre fixe au-dessus de la bottom nav : action, ligne du joueur, etc. */
  bottomBar?: ReactNode
  bottomNav?: ReactNode
  /** Sheets et overlays, rendus dans l'écran. */
  overlay?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * Structure d'un écran mobile : header, contenu scrollable, barre basse facultative, bottom nav.
 * Les safe areas viennent de `--jo-safe-top` et `--jo-safe-bottom`, à 0 par défaut.
 */
export function Screen({ banner: own, header, bottomBar, bottomNav, overlay, className, children }: ScreenProps) {
  const global = useGlobalBanner()
  const banner = useBannerPresence(global ?? own)
  const head = useRef<HTMLDivElement>(null)
  const main = useRef<HTMLElement>(null)
  return (
    // Largeur « regular » (cadre web paysage, `jo-regular`, 2026-11-16) : la bottom nav passe en rail à gauche du contenu
    // (`flex-row-reverse` : l'ordre du DOM reste contenu puis navigation). Les overlays couvrent les deux.
    <div data-jo-screen className={cn('relative flex h-full flex-col overflow-hidden bg-jo-bg text-jo-text', bottomNav && 'jo-regular:flex-row-reverse', className)}>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Porte `--jo-header-edge` (écrit ici) et `--jo-tabs-dock` (écrit par `StickyBar`) : sœur de `main`, une écriture
          n'invalide que l'en-tête, jamais le contenu qui défile. */}
      <div ref={head} data-jo-screen-header className={cn('relative flex-none', !banner && 'pt-[var(--jo-safe-top,0px)]')}>
        {banner}
        {header}
        {header && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-jo-border" style={{ opacity: 'calc(var(--jo-header-edge, 0) * (1 - var(--jo-tabs-dock, 0)))' }} />}
      </div>
      <main ref={main} onScroll={(event) => {
        setStyleVar(head.current, '--jo-header-edge', String(Math.max(0, Math.min(1, event.currentTarget.scrollTop / 8))))
      }} className={cn('jo-no-scrollbar min-h-0 flex-1 overflow-y-auto', !bottomNav && !bottomBar && 'pb-[var(--jo-safe-bottom,0px)]')}>
        {children}
      </main>
      {/* Sans bottom nav, la barre basse porte la safe area : ses boutons ne passent jamais sous l'indicateur d'accueil.
          Filet haut `border` permanent (2026-11-19), défilement ou non. */}
      {bottomBar && (
        <div className={cn('jo-bottom-bar relative flex-none', !bottomNav && 'pb-[var(--jo-safe-bottom,0px)]')}>
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-jo-border" />
          {bottomBar}
        </div>
      )}
      </div>
      {bottomNav}
      {overlay}
    </div>
  )
}
