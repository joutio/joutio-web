import useEmblaCarousel from 'embla-carousel-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'

export type CarouselProps = {
  /** Une diapositive par page, dans l'ordre. */
  slides: readonly ReactNode[]
  /** Page affichée, pilotée par l'écran (flèches, onglets, Continuer). */
  index: number
  /** Page atteinte au balayage (doigt, souris, clavier). */
  onIndexChange: (index: number) => void
  /** Nom accessible du carrousel. */
  label: string
  className?: string
  /** Classes de chaque diapositive : par défaut, elle défile verticalement si son contenu dépasse. */
  slideClassName?: string
}

/**
 * Pages à balayer horizontalement (Embla, décision du 2026-11-12) : Détails du duel, séquence de déblocages,
 * Signalements d'une question. L'index reste celui de l'écran ; le carrousel s'y cale et le remonte au balayage. Chaque
 * diapositive défile verticalement à l'intérieur : un contenu long reste lisible. `data-vaul-no-drag` : dans une
 * `MobileSheet`, le balayage ne tire pas la feuille.
 */
export function Carousel({ slides, index, onIndexChange, label, className, slideClassName }: CarouselProps) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [viewport, api] = useEmblaCarousel({ startIndex: index })
  const report = useRef(onIndexChange)
  useEffect(() => {
    report.current = onIndexChange
  }, [onIndexChange])

  useEffect(() => {
    if (!api) return
    const onSelect = () => report.current(api.selectedScrollSnap())
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  // Pages ajoutées ou retirées (file traitée) : Embla remesure.
  useEffect(() => {
    api?.reInit()
  }, [api, slides.length])

  useEffect(() => {
    if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, reduced)
  }, [api, index, reduced])

  return (
    <div
      ref={viewport}
      data-vaul-no-drag
      role="region"
      aria-roledescription="carrousel"
      aria-label={label}
      className={cn('min-h-0 overflow-hidden', className)}
    >
      <div className="flex h-full touch-pan-y">
        {slides.map((slide, slideIndex) => (
          <section
            key={slideIndex}
            aria-roledescription="diapositive"
            aria-label={`${slideIndex + 1} sur ${slides.length}`}
            aria-hidden={slideIndex !== index}
            inert={slideIndex !== index}
            className={cn('jo-no-scrollbar h-full min-w-0 flex-[0_0_100%] overflow-x-hidden overflow-y-auto overscroll-y-contain', slideClassName)}
          >
            {slide}
          </section>
        ))}
      </div>
    </div>
  )
}
