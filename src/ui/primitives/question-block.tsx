import { useState, type CSSProperties } from 'react'
import { cn } from '../lib/cn'
import { AnswerCard, type AnswerCardProps } from './answer-card'

const IMAGE = 'absolute inset-0 m-auto rounded-jo-xl object-contain ring-1 ring-jo-border'
/** Ratio de réserve tant que l'image n'est pas chargée. */
const IMAGE_RATIO = 5 / 4

export type QuestionBlockProps = {
  text: string
  /** Sujet et avancement, par exemple « Rois de France · question 4 sur 7 ». */
  meta?: string
  image?: string
  imageAlt?: string
  /** Absentes pendant le temps de lecture. */
  answers?: readonly AnswerCardProps[]
  /**
   * Réponses visibles (par défaut). `false` : invisibles et inactives, à leur place, pour que l'énoncé et l'image ne
   * bougent pas à leur arrivée (duel : lecture verrouillée du serveur) ; à `true`, elles entrent une à une.
   */
  answersShown?: boolean
  /** Disposition des réponses. `auto` : 2 × 2 avec une image ou quand la hauteur manque, 4 × 1 sinon. */
  layout?: 'auto' | '2x2' | '4x1'
  /** Option d'affichage des cartes, appliquée à toutes sauf si une réponse la précise. */
  details?: boolean
  /** Joue l'apparition : énoncé, temps de lecture, puis réponses une à une. Chaque réponse se clique dès son entrée. */
  animated?: boolean
  /**
   * Temps de lecture avant les réponses (2 s). `false` quand l'écran passe les réponses au bloc à la fin de la lecture
   * (duel : phase verrouillée du serveur) : elles entrent aussitôt.
   */
  readDelay?: boolean
  /** Dernière réponse entrée, y compris en mouvement réduit : le chrono part à cet instant. */
  onRevealed?: () => void
  className?: string
}

/**
 * Énoncé et réponses d'une manche. Prend la taille de son parent, qui doit avoir une hauteur.
 * Par défaut, le bloc décide de la disposition : 2 × 2 avec une image ou quand la hauteur manque, liste sinon.
 * Chaque composante a sa zone dédiée (2026-11-10) : méta, énoncé (deux lignes réservées avec une image), image (tout l'espace
 * restant, contenue dans sa zone à son ratio réel, 370 px de large au plus) puis réponses. L'image ne déborde jamais sur
 * l'énoncé ni sous les réponses, et n'est jamais rognée (2026-11-15) : sa boîte épouse l'image, coins arrondis compris.
 */
export function QuestionBlock({ text, meta, image, imageAlt = '', answers, answersShown = true, layout = 'auto', details, animated = false, readDelay = true, onRevealed, className }: QuestionBlockProps) {
  const [loaded, setLoaded] = useState<{ image: string; ratio: number } | null>(null)
  const ratio = loaded && loaded.image === image ? loaded.ratio : IMAGE_RATIO
  const reveal = animated && answersShown && answers && answers.length > 0
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
          // Hors du flux : la hauteur vient de la cellule, quel que soit le calcul de la ligne par le navigateur. La cellule
          // est un conteneur de taille : la plus grande boîte au ratio de l'image qui y tient, 370 px de large au plus.
          <div className="relative min-h-0 min-w-0 [container-type:size]">
            <img
              src={image}
              alt={imageAlt}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget
                if (naturalWidth > 0 && naturalHeight > 0) setLoaded({ image, ratio: naturalWidth / naturalHeight })
              }}
              className={cn(IMAGE, animated && 'jo-question-fade')}
              style={{ width: `min(100cqw, 370px, calc(100cqh * ${ratio}))`, aspectRatio: ratio }}
            />
          </div>
        )}
      </div>
      {answers && answers.length > 0 && (
        <div
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) onRevealed?.()
          }}
          style={reveal ? ({ '--jo-answer-count': answers.length, ...(readDelay ? {} : { '--jo-question-read': '0ms' }) } as CSSProperties) : undefined}
          aria-hidden={answersShown ? undefined : true}
          inert={!answersShown}
          className={cn('grid flex-none', !answersShown && 'invisible', reveal && 'jo-question-answers', answersLayout)}
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
