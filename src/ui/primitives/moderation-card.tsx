import { CheckCircleIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { Button } from './button'

export type ModerationCardProps = {
  /** Auteur, rôle et date. */
  author: string
  question: string
  answers: readonly string[]
  /** Index de la bonne réponse. */
  correct: number
  onApprove?: () => void
  onReject?: () => void
  onEdit?: () => void
  className?: string
}

/** Question proposée par un rédacteur, à valider. */
export function ModerationCard({ author, question, answers, correct, onApprove, onReject, onEdit, className }: ModerationCardProps) {
  return (
    <article className={cn('grid gap-3 rounded-jo-lg bg-jo-surface p-4', className)}>
      <span className="jo-type-caption text-jo-muted">{author}</span>
      <strong className="jo-type-headline">{question}</strong>
      <ul className="m-0 list-none overflow-hidden rounded-jo-lg bg-jo-raised p-0">
        {answers.map((answer, index) => (
          <li key={answer} className={cn('flex min-h-[50px] items-center justify-between gap-3 px-4 py-2', index < answers.length - 1 && 'border-b border-jo-border')}>
            <span className={cn('jo-type-body min-w-0', index === correct && 'font-semibold')}>{answer}</span>
            {index === correct && <CheckCircleIcon size={20} weight="fill" className="flex-none text-jo-correct" aria-hidden />}
            {index === correct && <span className="sr-only">, bonne réponse</span>}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="tinted" tone="destructive" size="M" full onClick={onReject}>
          Rejeter
        </Button>
        <Button size="M" full onClick={onApprove}>
          Approuver
        </Button>
      </div>
      <Button variant="plain" tone="neutral" size="M" full onClick={onEdit}>
        Modifier avant d'approuver
      </Button>
    </article>
  )
}
