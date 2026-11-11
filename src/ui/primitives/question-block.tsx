import type { CSSProperties } from 'react'
import { cn } from '../lib/cn'
import { AnswerCard, type AnswerCardProps } from './answer-card'

const IMAGE = 'aspect-[5/4] rounded-jo-xl object-cover ring-1 ring-jo-border'

export type QuestionBlockProps = {
  text: string
  /** Sujet et avancement, par exemple « Rois de France · question 4 sur 7 ». */
  meta?: string
  image?: string
  imageAlt?: string
  /** Absentes pendant le temps de lecture. */
  answers?: readonly AnswerCardProps[]
  /** Disposition des réponses. `auto` : 2 × 2 avec une image ou quand la hauteur manque, 4 × 1 sinon. */
  layout?: 'auto' | '2x2' | '4x1'
  /** Option d'affichage des cartes, appliquée à toutes sauf si une réponse la précise. */
  details?: boolean
  /** Joue l'apparition : énoncé, temps de lecture, puis réponses une à une. */
  animated?: boolean
  /** Réponses visibles et actives, y compris en mouvement réduit : l'écran lance alors le chrono. */
  onRevealed?: () => void
  className?: string
}

/**
 * Énoncé et réponses d'une manche. Prend la taille de son parent, qui doit avoir une hauteur.
 * Par défaut, le bloc décide de la disposition : 2 × 2 avec une image ou quand la hauteur manque, liste sinon.
 * Chaque composante a sa zone dédiée (2026-11-10) : méta, énoncé (deux lignes réservées avec une image), image (tout l'espace
 * restant, 5:4 contenue dans sa zone) puis réponses. L'image ne déborde jamais sur l'énoncé ni sous les réponses.
 */
export function QuestionBlock({ text, meta, image, imageAlt = '', answers, layout = 'auto', details, animated = false, onRevealed, className }: QuestionBlockProps) {
  const reveal = animated && answers && answers.length > 0
  const grid = layout === '2x2' || (layout === 'auto' && Boolean(image))
  // Hauteurs relatives au bloc : 18 % en 2 × 2, 12 % en 4 × 1. Le minimum protège les petits blocs, un texte long peut agrandir.
  const answersLayout = grid ? 'auto-rows-fr grid-cols-2 gap-2' : layout === '4x1' ? 'grid-cols-1 gap-2' : 'grid-cols-1 gap-3 jo-question-short:auto-rows-fr jo-question-short:grid-cols-2 jo-question-short:gap-2'
  const cardLayout = grid ? 'h-full min-h-[max(18cqh,72px)]' : layout === '4x1' ? 'min-h-[max(12cqh,64px)]' : 'min-h-[max(12cqh,64px)] jo-question-short:h-full jo-question-short:min-h-[max(18cqh,72px)]'
  return (
    <div className={cn('jo-question flex size-full flex-col gap-4 text-center', className)}>
      <div className={cn('grid min-h-0 gap-3', image ? cn('flex-1', meta ? 'grid-rows-[auto_auto_minmax(0,1fr)]' : 'grid-rows-[auto_minmax(0,1fr)]') : 'flex-1 content-center')}>
        {meta && <span className={cn('jo-type-caption font-semibold text-jo-muted', animated && 'jo-question-fade')}>{meta}</span>}
        <p className={cn('jo-type-question m-0 min-w-0 text-balance wrap-anywhere hyphens-auto', image && 'grid min-h-[2.6em] content-center', animated && 'jo-question-rise')}>{text}</p>
        {image && (
          // Hors du flux : la hauteur vient de la cellule, quel que soit le calcul de la ligne par le navigateur.
          <div className="relative min-h-0 min-w-0">
            <img src={image} alt={imageAlt} className={cn(IMAGE, 'absolute inset-0 m-auto h-full max-w-[370px]', animated && 'jo-question-fade')} />
          </div>
        )}
      </div>
      {answers && answers.length > 0 && (
        <div
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) onRevealed?.()
          }}
          style={reveal ? ({ '--jo-answer-count': answers.length } as CSSProperties) : undefined}
          className={cn('grid flex-none', reveal && 'jo-question-answers', answersLayout)}
        >
          {answers.map((answer, index) => (
            <div key={answer.label} className={cn('grid', reveal && 'jo-answer-in')} style={reveal ? ({ '--jo-answer-index': index } as CSSProperties) : undefined}>
              <AnswerCard details={details} {...answer} className={cn(cardLayout, answer.className)} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
