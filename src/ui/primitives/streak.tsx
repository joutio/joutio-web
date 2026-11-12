import { CheckIcon, FireIcon, XIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'

export type StreakDay = 'done' | 'today' | 'missed' | 'future'

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const DAY_STYLES: Record<StreakDay, string> = {
  done: 'bg-jo-accent text-jo-on-accent',
  today: 'text-jo-accent-ink ring-2 ring-jo-accent ring-inset',
  missed: 'bg-jo-wrong text-jo-on-wrong',
  future: 'text-jo-muted ring-1 ring-jo-border ring-inset',
}

const DAY_NAMES: Record<StreakDay, string> = { done: 'joué', today: "aujourd'hui", missed: 'manqué', future: 'à venir' }

export type StreakProps = {
  count: number
  hint?: string
  /** Sept jours, du lundi au dimanche. */
  week?: readonly StreakDay[]
  compact?: boolean
  className?: string
}

export function Streak({ count, hint, week, compact = false, className }: StreakProps) {
  const active = count > 0
  return (
    <div className={cn('grid w-full gap-4', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('grid size-11 flex-none place-items-center rounded-jo-md', active ? 'bg-jo-warm text-jo-accent-ink' : 'bg-jo-raised text-jo-muted')}>
          <FireIcon size={24} weight="fill" aria-hidden />
        </span>
        <div className="min-w-0">
          <strong className="jo-type-numeric block">{count > 1 ? `${count} jours` : `${count} jour`}</strong>
          {hint && <span className="jo-type-caption text-jo-muted">{hint}</span>}
        </div>
      </div>
      {!compact && week && (
        <ol className="grid grid-cols-7 gap-2">
          {week.map((day, index) => (
            <li key={index} className="grid justify-items-center gap-1" aria-label={`${DAY_LABELS[index]}, ${DAY_NAMES[day]}`}>
              <span className="jo-type-caption font-semibold text-jo-muted">{DAY_LABELS[index]}</span>
              <span className={cn('grid size-9 place-items-center rounded-jo-full', DAY_STYLES[day])}>
                {day === 'done' && <CheckIcon size={16} aria-hidden />}
                {day === 'today' && <FireIcon size={16} weight="fill" aria-hidden />}
                {day === 'missed' && <XIcon size={16} aria-hidden />}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
