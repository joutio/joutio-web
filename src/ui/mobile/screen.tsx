import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { useGlobalBanner } from '../primitives/banner'

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
  const banner = useGlobalBanner() ?? own
  return (
    <div data-jo-screen className={cn('relative flex h-full flex-col overflow-hidden bg-jo-bg text-jo-text', className)}>
      <div className={cn('relative flex-none', !banner && 'pt-[var(--jo-safe-top,0px)]')}>
        {banner}
        {header}
        {header && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-jo-border" style={{ opacity: 'calc(var(--jo-header-edge, 0) * (1 - var(--jo-tabs-dock, 0)))' }} />}
      </div>
      <main onScroll={(event) => {
        const main = event.currentTarget
        main.closest<HTMLElement>('[data-jo-screen]')?.style.setProperty('--jo-header-edge', String(Math.max(0, Math.min(1, main.scrollTop / 8))))
      }} className={cn('jo-no-scrollbar min-h-0 flex-1 overflow-y-auto', !bottomNav && !bottomBar && 'pb-[var(--jo-safe-bottom,0px)]')}>
        {children}
      </main>
      {/* Sans bottom nav, la barre basse porte la safe area : ses boutons ne passent jamais sous l'indicateur d'accueil. */}
      {bottomBar && (bottomNav ? bottomBar : <div className="flex-none bg-jo-bg pb-[var(--jo-safe-bottom,0px)]">{bottomBar}</div>)}
      {bottomNav}
      {overlay}
    </div>
  )
}
