import type { KeyboardEvent } from 'react'

const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/** Garde Tab et Maj+Tab dans un dialog ou une feuille modale. */
export function trapTab(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Tab') return
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)]
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

/** Premier élément focalisable d'un conteneur. */
export const firstFocusable = (root: HTMLElement | null) => root?.querySelector<HTMLElement>(FOCUSABLE) ?? null
