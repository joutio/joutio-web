import { cn } from '../lib/cn'

export type PageDotsProps = {
  count: number
  /** Position courante, à partir de 0. */
  index: number
  className?: string
}

export function PageDots({ count, index, className }: PageDotsProps) {
  return (
    <div role="img" aria-label={`${index + 1} sur ${count}`} className={cn('flex items-center justify-center gap-1.5', className)}>
      {Array.from({ length: count }, (_, dot) => (
        <span
          key={dot}
          className={cn(
            'jo-transition h-1.5 rounded-jo-xs',
            dot === index ? 'w-5 bg-jo-accent' : 'w-1.5',
            dot < index && 'bg-jo-muted',
            dot > index && 'bg-jo-border',
          )}
        />
      ))}
    </div>
  )
}
