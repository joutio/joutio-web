import { cn } from '../lib/cn'

const HEADS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export type StreakCalendarProps = {
  month: string
  legend?: string
  /** Cases vides avant le 1er du mois. */
  offset: number
  days: number
  today: number
  /** Jours joués. */
  active: readonly number[]
  className?: string
}

export function StreakCalendar({ month, legend, offset, days, today, active, className }: StreakCalendarProps) {
  return (
    <section aria-label={month} className={cn('grid w-full gap-2', className)}>
      <div className="flex items-baseline justify-between">
        <strong className="jo-type-headline">{month}</strong>
        {legend && <span className="jo-type-caption text-jo-muted">{legend}</span>}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {HEADS.map((head, index) => (
          <span key={index} className="jo-type-caption text-center font-semibold text-jo-muted">
            {head}
          </span>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`empty-${index}`} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1
          const played = active.includes(day)
          return (
            <span
              key={day}
              className={cn(
                'jo-type-caption grid aspect-square place-items-center font-mono font-semibold',
                played ? 'bg-jo-accent text-jo-on-accent' : 'bg-jo-raised text-jo-muted',
                day === today && 'ring-2 ring-jo-accent ring-inset',
                day > today && 'opacity-35',
              )}
            >
              {day}
              {/* La couleur ne suffit pas : l'état du jour est aussi dit en toutes lettres. */}
              {(played || day === today) && <span className="sr-only">{[played && ', joué', day === today && ", aujourd'hui"].filter(Boolean).join('')}</span>}
            </span>
          )
        })}
      </div>
    </section>
  )
}
