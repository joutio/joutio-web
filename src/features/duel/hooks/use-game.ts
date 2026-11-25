import { useEffect } from 'react'
/**
 * Précharge les images des questions dès la création de la partie (`GAME_CREATED` les donne dans l'ordre des manches),
 * pendant le face-à-face : une connexion faible ne coûte pas de temps de réponse. La première d'abord, puis les autres.
 */
export function usePrefetchQuestionImages(urls: readonly string[]) {
  const key = urls.join('|')
  useEffect(() => {
    const unique = [...new Set(urls.filter(Boolean))]
    if (unique.length === 0) return
    let cancelled = false
    const load = (src: string) =>
      new Promise<void>((resolve) => {
        const image = new Image()
        image.onload = image.onerror = () => resolve()
        image.src = src
      })
    const [first, ...rest] = unique
    void load(first).then(() => {
      if (!cancelled) rest.forEach((src) => void load(src))
    })
    return () => {
      cancelled = true
    }
    // Les URL ne changent qu'avec la partie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}
