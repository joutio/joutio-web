import { useEffect, useState } from "react"

/** Champs pour lesquels le focus n'ouvre pas de clavier (boutons, cases, etc.). */
const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "submit",
  "reset",
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "date",
  "time",
])

function isTextEntryElement(element: Element | null): boolean {
  if (!element) return false
  const tag = element.tagName
  if (tag === "TEXTAREA" || tag === "SELECT") return true
  if (tag === "INPUT") {
    const type = (element as HTMLInputElement).type
    return !NON_TEXT_INPUT_TYPES.has(type)
  }
  return (element as HTMLElement).isContentEditable
}

/**
 * Vrai tant qu'un champ texte a le focus — sur mobile, le clavier virtuel est alors ouvert.
 * Permet de masquer la nav basse (elle serait recouverte par le clavier).
 */
export function useTextInputFocus(): boolean {
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    // `focusout` précède le `focusin` suivant : on lit l'état final à la frame suivante.
    const update = () => {
      window.requestAnimationFrame(() => {
        setFocused(isTextEntryElement(document.activeElement))
      })
    }

    document.addEventListener("focusin", update)
    document.addEventListener("focusout", update)
    return () => {
      document.removeEventListener("focusin", update)
      document.removeEventListener("focusout", update)
    }
  }, [])

  return focused
}
