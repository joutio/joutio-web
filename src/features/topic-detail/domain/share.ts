import type { TFunction } from "i18next"

/** Message de partage d'un thème : invitation à découvrir, y compris sans compte. */
export function topicShareMessage(t: TFunction, topicName: string): string {
  return t("topic.share.message", { name: topicName })
}
