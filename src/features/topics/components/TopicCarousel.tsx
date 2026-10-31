import type { TopicCard } from "@/features/topics/domain/topic"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { HorizontalRail } from "@/shared/components/horizontal-rail"
import { TopicMediaCard, type TopicMediaFormat } from "./TopicMediaCard"

/** Largeur unique des cartes de l'Accueil, quel que soit le format. */
const CARD_WIDTH = "w-[58vw] max-w-[230px] tablet:w-48 desktop:w-52"

/**
 * Bandeau horizontal de sujets de l'Accueil, en cartes façon FranceTV — **même largeur** pour
 * tous les formats : cartes portrait `poster` (Top 10, 5:8 avec pied intégré à toutes les
 * tailles) ou cartes paysage 16:9 (`landscape`). Avec `ranked` sur un rail `poster`, chaque
 * affiche reçoit son rang SVG dans la gouttière gauche de 42 px de la référence ; la largeur
 * intrinsèque de chaque chiffre détermine son chevauchement par la carte. Le défilement passe par
 * `HorizontalRail` : Arc `ScrollArea` en desktop (barre fine en surimpression, fondus), scroller
 * natif full-bleed en compact/tablette — 12 px réservés sous les cartes à plat en clair, 28 px en
 * sombre pour l'ombre.
 */
export function TopicCarousel({
  topics,
  onOpen,
  label,
  format = "landscape",
  ranked = false,
}: {
  topics: TopicCard[]
  onOpen: (topicId: string) => void
  /** Nom accessible du bandeau (une région par carrousel sur l'accueil). */
  label?: string
  /** `poster` : cartes 5:8 du Top 10 ; `landscape` : cartes 16:9. */
  format?: TopicMediaFormat
  /** Affiche le classement 1 → n à gauche des affiches (Top 10 des plus joués). */
  ranked?: boolean
}) {
  const { t } = useTranslation()
  const withRank = ranked && format === "poster"

  return (
    <HorizontalRail
      label={label ?? t("topics.carousel.region")}
      fade={withRank ? 12 : 28}
      viewportClassName="flex gap-4 pb-3 dark:pb-7"
    >
      {topics.map((topic, index) => {
        const rank = withRank ? index + 1 : undefined
        return (
          <div
            key={topic.topicId}
            className={cn(
              "shrink-0",
              rank !== undefined && "pl-[42px]"
            )}
          >
            <TopicMediaCard
              topic={topic}
              onOpen={onOpen}
              format={format}
              rank={rank}
              priority={index === 0}
              className={CARD_WIDTH}
            />
          </div>
        )
      })}
    </HorizontalRail>
  )
}
