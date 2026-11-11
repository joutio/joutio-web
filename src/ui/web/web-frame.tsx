import { AppleLogoIcon, GooglePlayLogoIcon, QrCodeIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Logo } from '../brand/logo'
import { cn } from '../lib/cn'
import { buttonStyles } from '../primitives/button'
import { StoreButtons, type StoreLinks } from '../site/store-buttons'

export type WebFrameProps = {
  /** Liens des stores, à droite de la colonne. */
  stores: StoreLinks
  /** Accroche sous le logo, à gauche de la colonne. */
  tagline?: string
  /** Image du QR code vers l'app. Sans image, un emplacement réservé. */
  qrSrc?: string
  className?: string
  children: ReactNode
}

/**
 * Cadre de l'app web (D16) : Joutio n'a pas de composition grand écran. Sous 640 px (web compact), l'app prend
 * toute la largeur. Au-delà, tablette comprise, elle reste dans une colonne de téléphone de 430 px, centrée sur le
 * fond `canvas`, et la marque occupe les marges : logo et accroche à gauche, invitation à installer l'app à droite.
 * Sous 1 024 px, les marges sont étroites : espacements et QR code réduits. La colonne est le conteneur des tailles fluides (`cqw`) et des feuilles, dialogues et toasts.
 * Les bascules suivent la largeur du cadre (`@container/web`), pas la fenêtre.
 */
export function WebFrame({ stores, tagline = 'Le quiz en duel, sur tous les sujets.', qrSrc, className, children }: WebFrameProps) {
  const aside = 'row-start-1 hidden min-w-0 content-center p-4 @min-[640px]/web:grid @min-[1024px]/web:p-10'
  return (
    <div className={cn('@container/web h-full w-full', className)}>
      <div className="grid h-full grid-cols-[minmax(0,1fr)] @min-[640px]/web:grid-cols-[minmax(0,1fr)_430px_minmax(0,1fr)] @min-[640px]/web:bg-jo-canvas">
        <aside className={cn(aside, 'col-start-1 justify-items-end text-right')}>
          <div className="grid max-w-[280px] justify-items-end gap-4">
            {/* Marges étroites sous 1 024 px : logo et accroche plus petits. */}
            <span className="@min-[1024px]/web:hidden">
              <Logo variant="lockup" size={36} />
            </span>
            <span className="hidden @min-[1024px]/web:block">
              <Logo variant="lockup" size={44} />
            </span>
            <p className="jo-type-headline m-0 text-balance text-jo-muted @min-[1024px]/web:hidden">{tagline}</p>
            <p className="jo-type-title-2 m-0 hidden text-balance text-jo-muted @min-[1024px]/web:block">{tagline}</p>
          </div>
        </aside>
        <div className="relative row-start-1 h-full min-w-0 overflow-hidden bg-jo-bg [container-type:inline-size] @min-[640px]/web:col-start-2 @min-[640px]/web:border-x @min-[640px]/web:border-jo-border @min-[640px]/web:shadow-jo">
          {children}
        </div>
        <aside className={cn(aside, 'col-start-3 justify-items-start')} aria-label="Installer l'app">
          <div className="grid max-w-[280px] gap-4">
            <p className="jo-type-headline m-0">Joue aussi sur mobile</p>
            {qrSrc ? (
              <img src={qrSrc} alt="QR code vers l'app Joutio" className="size-28 rounded-jo-md bg-white p-2 @min-[1024px]/web:size-36" />
            ) : (
              <span role="img" aria-label="QR code vers l'app Joutio" className="grid size-28 place-items-center @min-[1024px]/web:size-36 rounded-jo-md bg-jo-surface text-jo-text ring-1 ring-jo-border">
                <QrCodeIcon aria-hidden className="size-20 @min-[1024px]/web:size-24" />
              </span>
            )}
            <p className="jo-type-caption m-0 text-jo-muted">Scanne avec ton téléphone, ou télécharge l'app.</p>
            <span className="hidden @min-[1024px]/web:block">
              <StoreButtons links={stores} />
            </span>
            {/* Marges étroites : boutons compacts, empilés, même hiérarchie (`filled` neutre). */}
            <div className="grid gap-2 @min-[1024px]/web:hidden">
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
  )
}
