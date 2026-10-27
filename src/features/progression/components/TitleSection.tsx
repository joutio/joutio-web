import { useTranslation } from "react-i18next"
import { Crown } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { SelectRow } from "@/shared/components/select-row"
import { TopicIcon } from "@/shared/components/topic-icon"
import { showSuccessToast } from "@/shared/utils/success-toast"
import {
  equippedTitle,
  type PlayerTitles,
} from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { useEquippedTitleLabel } from "../hooks/useEquippedTitleLabel"
import { RankBadge } from "./RankBadge"

interface TitleSectionProps {
  userId: string
  titles: PlayerTitles
}

/**
 * Réglages — **titre affiché** : ligne d'état (titre porté et visuel de son sujet, ou aucun) et
 * **retrait** du titre porté. Le choix d'un titre vit exclusivement dans l'onglet « Titres »
 * d'une fiche sujet — les Réglages n'ouvrent plus de sélecteur.
 */
export function TitleSection({ userId, titles }: TitleSectionProps) {
  const { t } = useTranslation()
  const equipTitle = useEquipTitle(userId)
  const label = useEquippedTitleLabel(titles)
  const equipped = equippedTitle(titles)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {t("progression.titlesHint")}{" "}
        <Link to="/topics" className="underline underline-offset-2">
          {t("progression.titlesBrowse")}
        </Link>
      </p>

      <SelectRow
        visual={
          equipped ? (
            <TopicIcon topic={equipped.topic} size={34} />
          ) : (
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
              aria-hidden
            >
              <Crown className="size-4" />
            </span>
          )
        }
        title={label ?? t("progression.titlesNone")}
        subtitle={
          equipped ? (
            <RankBadge rank={equipped.tier} />
          ) : null
        }
      />

      {equipped && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="destructive"
            disabled={equipTitle.isPending}
            onClick={() =>
              equipTitle.mutate(null, {
                onSuccess: () =>
                  showSuccessToast(t("progression.toasts.titleRemoved")),
              })
            }
          >
            {t("progression.titleRemove")}
          </Button>
        </div>
      )}
    </div>
  )
}
