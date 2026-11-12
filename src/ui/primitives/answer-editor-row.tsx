import { CheckIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { tint } from '../lib/tokens'

export type AnswerEditorRowProps = {
  value: string
  onChange?: (value: string) => void
  /** Bonne réponse. */
  correct?: boolean
  onMarkCorrect?: () => void
  /** Numéro de la réponse, pour les libellés. */
  index: number
  maxLength?: number
  /** Indication du champ vide, `Réponse N` par défaut : par exemple la réponse française à traduire. */
  placeholder?: string
  last?: boolean
  className?: string
}

/** Saisie d'une réponse, puis bouton « Juste », dans un `radiogroup`. Le mot double la couleur. */
export function AnswerEditorRow({ value, onChange, correct = false, onMarkCorrect, index, maxLength = 60, placeholder, last = false, className }: AnswerEditorRowProps) {
  return (
    <div
      style={correct ? { backgroundColor: tint('var(--jo-correct)') } : undefined}
      className={cn('jo-transition grid min-h-[50px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 pr-1 pl-4', !last && 'border-b border-jo-border', className)}
    >
      <input
        value={value}
        maxLength={maxLength}
        aria-label={`Réponse ${index}`}
        placeholder={placeholder ?? `Réponse ${index}`}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn('jo-type-body w-full min-w-0 bg-transparent text-jo-text outline-none placeholder:text-jo-muted', correct && 'font-semibold')}
      />
      <button
        type="button"
        role="radio"
        aria-checked={correct}
        aria-label={`Réponse ${index} : bonne réponse`}
        onClick={onMarkCorrect}
        className="jo-focus grid min-h-11 cursor-pointer place-items-center rounded-jo-sm px-2"
      >
        <span className={cn('jo-type-caption jo-transition flex h-7 items-center gap-1 rounded-jo-full px-3 font-semibold', correct ? 'bg-jo-correct text-jo-on-correct' : 'text-jo-muted ring-1 ring-jo-border ring-inset')}>
          {correct && <CheckIcon size={14} weight="bold" aria-hidden />}
          Juste
        </span>
      </button>
    </div>
  )
}
