import { AppleLogoIcon, GooglePlayLogoIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { buttonStyles } from '../primitives/button'

// Porté de `design/src/design-system/site/site-chrome.tsx` : seuls `StoreLinks` et `StoreButtons`, utilisés par `WebFrame`.

export type StoreLinks = { appStore: string; googlePlay: string }

/**
 * Boutons de téléchargement : deux actions équivalentes, donc `filled` + `neutral` (`button.md`), pas deux
 * `filled` accent dans la même zone. Pas de badge officiel recolorié.
 */
export function StoreButtons({ links, className }: { links: StoreLinks; className?: string }) {
  const store = cn(buttonStyles({ variant: 'filled', tone: 'neutral' }), 'min-h-14 w-full cursor-pointer gap-3 px-5 no-underline active:scale-[.98]')
  return (
    // Grille à colonnes égales : les deux boutons ont toujours la même taille, empilés ou côte à côte (2026-11-10).
    <div className={cn('inline-grid w-fit gap-3 @xl:grid-flow-col @xl:auto-cols-fr', className)}>
      <a href={links.appStore} className={store}>
        <AppleLogoIcon size={26} weight="fill" aria-hidden />
        <span className="grid text-left">
          <span className="jo-type-caption opacity-75">Télécharger dans</span>
          <span className="jo-type-headline font-semibold">l'App Store</span>
        </span>
      </a>
      <a href={links.googlePlay} className={store}>
        <GooglePlayLogoIcon size={24} weight="fill" aria-hidden />
        <span className="grid text-left">
          <span className="jo-type-caption opacity-75">Disponible sur</span>
          <span className="jo-type-headline font-semibold">Google Play</span>
        </span>
      </a>
    </div>
  )
}
