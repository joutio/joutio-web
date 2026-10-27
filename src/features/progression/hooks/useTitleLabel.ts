import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useTopicName } from "@/features/shell"
import { masteryTierKeyOf } from "../components/labels"
import {
  titleLabel,
  topicTitleFor,
  type UnlockedTitle,
} from "../domain/progression"

/**
 * Compose le libellé d'affichage d'un titre débloqué : le titre **thématique** du sujet s'il
 * existe (« Maréchal d'Empire »), sinon le **palier seul** (« Or · Histoire »). Le serveur ne
 * fige aucun texte — le libellé suit le renommage du sujet et la langue du lecteur.
 */
export function useTitleLabel(): (title: UnlockedTitle) => string {
  const { t, i18n } = useTranslation()
  const resolveName = useTopicName()

  return useCallback(
    (title: UnlockedTitle) =>
      topicTitleFor(title.topic.titles, title.tier, i18n.language) ??
      titleLabel(t(masteryTierKeyOf(title.tier)), resolveName(title.topic.names)),
    [t, i18n.language, resolveName]
  )
}
