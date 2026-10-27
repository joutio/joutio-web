import { useCallback } from "react"
import { getSessionUserId as getUserId } from "@/features/auth"
import { useStompSubscription } from "@/shared/hooks/useStompSubscription"
import type { Achievement } from "../domain/achievement"
import { useAchievementStore } from "../stores/useAchievementStore"

/**
 * Flux des **déblocages** (`/topic/achievements/{userId}`, fan-out éphémère du BFF) : chaque
 * badge/titre gagné entre dans la file de célébrations. Le flux reste actif sur les écrans
 * immersifs (les déblocages y sont **conservés** et célébrés à la sortie), il ne l'est pas sans
 * session.
 */
export function useAchievementStream(): void {
  const userId = getUserId()
  const enqueue = useAchievementStore((state) => state.enqueue)

  const onMessage = useCallback(
    (message: { body: string }) => {
      try {
        const achievement = JSON.parse(message.body) as Achievement
        if (achievement?.kind === "BADGE" || achievement?.kind === "TITLE") {
          enqueue(achievement)
        }
      } catch {
        // Message illisible : on ignore (le flux est best-effort).
      }
    },
    [enqueue]
  )

  useStompSubscription(
    "progression",
    userId ? `/topic/achievements/${userId}` : null,
    onMessage
  )
}
