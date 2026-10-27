import { useTranslation } from "react-i18next"
import { Card, CardContent } from "@/components/ui/card"
import { useProfileTopicStats } from "@/features/player"
import { useTopicName } from "@/features/shell"
import { buildTopicsPlayedChart } from "../domain/topics-played-chart"
import { TopicsPlayedDonut } from "./TopicsPlayedDonut"

/**
 * Section « Sujets joués » du profil : donut des **parties humaines** par sujet (couleurs
 * éditoriales des sujets, 6 parts + « Autres ») posé dans une carte pour la visibilité — le
 * **titre reste hors de la carte** (comme les autres sections). Masquée tant que le joueur n'a
 * joué aucun duel humain.
 */
export function TopicsPlayedSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const { data, isLoading } = useProfileTopicStats(userId)

  const played = data ?? []
  if (isLoading || played.every((stat) => stat.games <= 0)) return null

  const chart = buildTopicsPlayedChart(
    played.map((stat) => ({
      key: stat.topicId,
      label: resolveName(stat.names),
      value: stat.games,
      color: stat.color,
    })),
    {
      maxSegments: 6,
      minShare: 0.02,
      otherLabel: t("shell.profile.topicsOther"),
    }
  )

  return (
    <section className="mb-8">
      {/* Le titre reste **hors** de la carte (comme les autres sections du profil). */}
      <h2 className="mb-4 font-heading text-base font-semibold">
        {t("shell.profile.topicsTitle")}
      </h2>
      <Card>
        {/* Marge intérieure resserrée : le donut occupe presque toute la carte, ce qui laisse
            plus de place aux colonnes de libellés et aux tracés d'attachement. En compact, la
            marge disparaît pour maximiser la largeur utile sur petit écran. */}
        <CardContent className="p-2 compact:p-0">
          <TopicsPlayedDonut
            chart={chart}
            ariaLabel={t("shell.profile.topicsAria")}
          />
        </CardContent>
      </Card>
    </section>
  )
}
