import { useEffect, useRef, type HTMLAttributes, type KeyboardEvent, type Ref } from 'react'

export type RadioGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'role'> & {
  /** Nom accessible du groupe. */
  label: string
  ref?: Ref<HTMLDivElement>
}

/** Options directes du groupe, sans celles d'un groupe imbriqué. */
const radiosOf = (group: HTMLElement) =>
  [...group.querySelectorAll<HTMLElement>('[role="radio"]')].filter((radio) => radio.closest('[role="radiogroup"]') === group)

/**
 * Groupe d'options à choix unique (`ListRow`, `TopicRow`, `PlanOption`, `AnswerEditorRow`…).
 * Une seule tabulation, sur l'option choisie (ou la première) ; flèches, Début et Fin choisissent une autre option.
 */
export function RadioGroup({ label, ref, onKeyDown, children, ...props }: RadioGroupProps) {
  const group = useRef<HTMLDivElement | null>(null)

  // Recalculé à chaque rendu : la sélection et la liste des options peuvent changer.
  useEffect(() => {
    if (!group.current) return
    const radios = radiosOf(group.current)
    const active = radios.find((radio) => radio.getAttribute('aria-checked') === 'true') ?? radios[0]
    for (const radio of radios) radio.tabIndex = radio === active ? 0 : -1
  })

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event)
    const radios = radiosOf(event.currentTarget).filter((radio) => !radio.hasAttribute('disabled'))
    const index = radios.indexOf(document.activeElement as HTMLElement)
    if (index === -1) return
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key]
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? radios.length - 1 : step === undefined ? -1 : (index + step + radios.length) % radios.length
    const radio = radios[next]
    if (!radio) return
    event.preventDefault()
    radio.focus()
    radio.click()
  }

  return (
    <div
      {...props}
      ref={(node) => {
        group.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      role="radiogroup"
      aria-label={label}
      onKeyDown={move}
    >
      {children}
    </div>
  )
}
