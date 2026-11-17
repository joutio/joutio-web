import { CheckIcon, FireIcon, XIcon } from '@phosphor-icons/react'
import { cn } from '../lib/cn'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { weekdayName } from '../lib/weekday'

export type StreakDay = 'done' | 'today' | 'missed' | 'future'


const DAY_STYLES: Record<StreakDay, string> = {
  done: 'bg-jo-accent text-jo-on-accent',
  today: 'text-jo-accent-ink ring-2 ring-jo-accent ring-inset',
  missed: 'bg-jo-wrong text-jo-on-wrong',
  future: 'text-jo-muted ring-1 ring-jo-border ring-inset',
}

const DAY_NAMES: Record<StreakDay, MessageKey> = { done: 'ds.played', today: 'ds.today', missed: 'ds.missed', future: 'ds.upcoming' }

export type StreakProps = {
  count: number
  hint?: string
  /** Sept jours, du lundi au dimanche. */
  week?: readonly StreakDay[]
  compact?: boolean
  className?: string
}

export function Streak({ count, hint, week, compact = false, className }: StreakProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const active = count > 0
  return (
    <div className={cn('grid w-full gap-4', className)}>
      <div className="flex items-center gap-3">
        <span className={cn('grid size-11 flex-none place-items-center rounded-jo-md', active ? 'bg-jo-warm text-jo-accent-ink' : 'bg-jo-raised text-jo-muted')}>
          <FireIcon size={24} weight="fill" aria-hidden />
        </span>
        <div className="min-w-0">
          <strong className="jo-type-numeric block">{t(count > 1 ? 'ds.daysMany' : 'ds.daysOne', { count })}</strong>
          {hint && <span className="jo-type-caption text-jo-muted">{hint}</span>}
        </div>
      </div>
      {!compact && week && (
        <ol className="grid grid-cols-7 gap-2">
          {week.map((day, index) => (
            <li key={index} className="grid justify-items-center gap-1" aria-label={t('ds.weekday', { day: weekdayName(index, language, 'long'), state: t(DAY_NAMES[day]) })}>
              <span className="jo-type-caption font-semibold text-jo-muted">{weekdayName(index, language, 'narrow').toUpperCase()}</span>
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
