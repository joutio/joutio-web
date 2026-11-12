import { questionStatus, type QuestionEditorView, type QuestionStatus } from '@joutio/client-domain/authoring'
import { ArchiveIcon, CheckCircleIcon, HourglassMediumIcon, ProhibitIcon, XCircleIcon, type Icon } from '@phosphor-icons/react'


/** Icône pleine du statut, à gauche de la ligne ; la sous-ligne le dit aussi en toutes lettres (`creation.md` § 1). */
const ICONS: Record<QuestionStatus, { icon: Icon; className: string }> = {
  approved: { icon: CheckCircleIcon, className: 'text-jo-correct' },
  pending: { icon: HourglassMediumIcon, className: 'text-jo-accent-ink' },
  rejected: { icon: XCircleIcon, className: 'text-jo-wrong' },
  suspended: { icon: ProhibitIcon, className: 'text-jo-wrong' },
  archived: { icon: ArchiveIcon, className: 'text-jo-muted' },
}

export function QuestionStatusIcon({ question }: { question: QuestionEditorView }) {
  const { icon: StatusIcon, className } = ICONS[questionStatus(question)]
  return <StatusIcon size={20} weight="fill" className={className} aria-hidden />
}
