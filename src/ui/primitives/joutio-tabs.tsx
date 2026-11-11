import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'

export type JoutioTabOption<T extends string> = {
  value: T
  label: string
  /** Force un état pour la documentation. */
  state?: 'pressed' | 'focus'
}

export type JoutioTabsProps<T extends string> = {
  options: readonly JoutioTabOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  /** Options à leur largeur et défilement horizontal, pour les longues listes d'onglets. */
  scrollable?: boolean
  className?: string
}

export function JoutioTabs<T extends string>({ options, value, onChange, label, scrollable = false, className }: JoutioTabsProps<T>) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(() => setWidth(element.clientWidth))
    setWidth(element.clientWidth)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Garde l'option active visible, sans bouger le scroll vertical de la page.
  useEffect(() => {
    const element = container.current
    const active = element?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!scrollable || !element || !active) return
    const left = active.offsetLeft - (element.clientWidth - active.offsetWidth) / 2
    element.scrollTo({ left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [scrollable, value])

  // Motif radio : une seule tabulation, les flèches sélectionnent l'option voisine.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    const index = options.findIndex((option) => option.value === value)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : step === undefined ? -1 : (index + step + options.length) % options.length
    const option = options[next]
    if (!option) return
    event.preventDefault()
    onChange(option.value)
    container.current?.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div
      ref={container}
      onKeyDown={onKeyDown}
      role="tablist"
      aria-label={label}
      style={scrollable ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(max-content, 1fr))` }}
      // `contain` : la largeur des options ne remonte pas au parent, la barre défile dans la place donnée.
      className={cn('h-11 w-full gap-0.5 rounded-jo-md bg-jo-raised p-1', scrollable ? 'jo-no-scrollbar relative flex overflow-x-auto [contain:inline-size]' : 'grid', className)}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            data-state={option.state}
            style={scrollable && width > 0 ? { minWidth: Math.max(0, (width - 8 - 2 * (options.length - 1)) / options.length) } : undefined}
            onClick={() => onChange(option.value)}
            className={cn(
              'jo-type-callout jo-transition jo-focus h-9 cursor-pointer rounded-jo-sm whitespace-nowrap jo-pressed:opacity-60',
              'px-1.5', scrollable && 'grow shrink-0',
              selected ? 'bg-jo-surface font-semibold text-jo-text' : 'text-jo-muted',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
