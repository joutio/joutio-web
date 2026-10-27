import type { TFunction } from "i18next"

/** Message de partage d'un salon (les intents réseaux vivent dans `shared/utils/share`). */
export function shareMessage(
  topicName: string | undefined,
  t: TFunction
): string {
  return topicName
    ? t("game.share.roomMessage", { topic: topicName })
    : t("game.share.roomMessageNoTopic")
}
