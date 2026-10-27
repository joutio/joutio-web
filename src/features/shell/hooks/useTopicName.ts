import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { topicName, type TopicNames } from "@/features/topics/domain/topic"
import { useMe } from "./useMe"

/**
 * Résout le nom d'un sujet dans la langue du joueur courant (`me.language`, repli `fr`).
 * À utiliser partout où l'API expose désormais `names` (Map) plutôt qu'un `name` unique.
 */
export function useTopicName() {
  const { data: me } = useMe()
  const { t } = useTranslation()
  const language = me?.language ?? "fr"
  return useCallback(
    (names: TopicNames | null | undefined, fallback?: string) =>
      topicName(names, language, fallback ?? t("shell.search.topicFallback")),
    [language, t]
  )
}
