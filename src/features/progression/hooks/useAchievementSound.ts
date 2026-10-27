import { useEffect, useRef } from "react"
import { playAchievementChime, stopChimes } from "@/shared/audio"
import { useSoundStore } from "@/shared/stores/useSoundStore"
import { achievementKey, type Achievement } from "../domain/achievement"

/**
 * Son de **déblocage** : la fanfare « ouverture de coffre » accompagne le premier élément de la
 * file, un scintillement court chacun des suivants. Une seule note par élément (dédup par clé) ;
 * quitter l'écran coupe net ce qui restait planifié.
 */
export function useAchievementSound(current: Achievement | undefined): void {
  const enabled = useSoundStore((state) => state.enabled)
  const played = useRef<string | null>(null)
  const firstPlayed = useRef(false)

  useEffect(() => stopChimes, [])

  useEffect(() => {
    if (!enabled || !current) return
    const key = achievementKey(current)
    if (played.current === key) return
    const timer = setTimeout(() => {
      played.current = key
      playAchievementChime(!firstPlayed.current)
      firstPlayed.current = true
    }, 0)
    return () => clearTimeout(timer)
  }, [enabled, current])

  // File vidée (fin de série) : la prochaine célébration repart sur la fanfare.
  useEffect(() => {
    if (!current) firstPlayed.current = false
  }, [current])
}
