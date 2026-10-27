import { useCallback, useLayoutEffect, useRef } from "react"

/** Plancher de lisibilité de l'énoncé (px). */
const MIN_QUESTION_FONT_SIZE = 13

/**
 * Résout en px le token responsive de taille d'énoncé via un élément sonde : l'énoncé porte une
 * taille ajustée (inline), donc on ne peut pas la relire directement. Repli 24 px si indéfini.
 */
function resolveQuestionFontSize(hasImage: boolean): number {
  const probe = document.createElement("span")
  probe.style.cssText = `position:absolute;left:-9999px;top:-9999px;font-size:var(${
    hasImage ? "--duel-question-size-image" : "--duel-question-size"
  })`
  document.body.appendChild(probe)
  const px = Number.parseFloat(getComputedStyle(probe).fontSize)
  probe.remove()
  return Number.isFinite(px) ? px : 24
}

/**
 * Titre adaptatif de l'arène : la police est choisie — par recherche dichotomique — comme la
 * **plus grande qui tient** dans l'espace disponible, plafonnée par le token responsive
 * (`--duel-question-size[-image]`). Aucune troncature, et les réponses ne sont jamais poussées
 * hors écran. Recalcule à chaque énoncé/round et sur redimensionnement (rotation, clavier…).
 */
export function useQuestionFit(
  hasImage: boolean,
  round: number,
  questionText: string
) {
  const boxRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  const fitQuestion = useCallback(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return
    const availableHeight = box.clientHeight
    const availableWidth = box.clientWidth
    if (availableHeight <= 0 || availableWidth <= 0) return

    const max = resolveQuestionFontSize(hasImage)
    const fits = (px: number) => {
      text.style.fontSize = `${px}px`
      return (
        text.scrollHeight <= availableHeight + 1 &&
        text.scrollWidth <= availableWidth + 1
      )
    }

    if (fits(max)) return

    let lo = MIN_QUESTION_FONT_SIZE
    let hi = max
    let best = MIN_QUESTION_FONT_SIZE
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (fits(mid)) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    text.style.fontSize = `${best}px`
  }, [hasImage])

  useLayoutEffect(() => {
    fitQuestion()
  }, [fitQuestion, round, questionText, hasImage])

  // Un changement de taille (rotation, clavier, sheet) relance l'ajustement.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => fitQuestion())
    observer.observe(box)
    return () => observer.disconnect()
  }, [fitQuestion])

  return { boxRef, textRef }
}
