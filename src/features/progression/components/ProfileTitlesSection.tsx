import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Check, Crown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ExpandableCard } from "@/components/arc/expandable-card/expandable-card"
import { EmptyState } from "@/shared/components/empty-state"
import { StickyHeaderFilters } from "@/shared/components/sticky-header-stack"
import {
  useUrlParam,
  useUrlParamBool,
  useUrlParams,
} from "@/shared/hooks/useUrlParam"
import { PageContainer } from "@/features/shell"
import { showSuccessToast } from "@/shared/utils/success-toast"
import {
  BADGE_TIERS,
  TITLE_CARD_ACCENT,
  filterTitles,
  isTitleRankFilter,
  tierColorOf,
  type PlayerTitles,
  type TitleRankFilter,
  type UnlockedTitle,
} from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { useTitleLabel } from "../hooks/useTitleLabel"
import { masteryTierKeyOf } from "./labels"
import { TitleFilterBar } from "./TitleFilterBar"

interface ProfileTitlesSectionProps {
  userId: string
  titles: PlayerTitles | undefined
  isLoading?: boolean
  /** L'onglet est actif : sa barre de filtres peut rejoindre le header sticky partagé. */
  stickyActive?: boolean
}

function rankOrder(title: UnlockedTitle): number {
  return BADGE_TIERS.indexOf(title.tier)
}

/**
 * Onglet « Titres » du profil : les titres **débloqués** sont des cartes dépliables, au même
 * langage que l'onglet Titres d'une fiche sujet — repliée, une carte ne porte que le libellé, la
 * pastille verte du palier atteint et un point de rang ; dépliée, elle affiche sa rareté puis
 * l'action Porter/Retirer. Le titre porté garde l'accent primaire et est déplié par défaut.
 *
 * Le bandeau filtre **côté client** (la vue `/titles` contient déjà tous les titres débloqués) par
 * recherche libre, rang et titre affiché ; l'état est persisté dans l'URL comme les autres
 * catalogues. Le tri reste du rang le plus rare au plus commun, puis alphabétique.
 */
export function ProfileTitlesSection({
  userId,
  titles,
  isLoading = false,
  stickyActive = true,
}: ProfileTitlesSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const titleLabel = useTitleLabel()
  const equipTitle = useEquipTitle(userId)
  const [query, setQuery] = useUrlParam<string>("titleQ", "")
  const [rankParam, setRank] = useUrlParam<string>("titleRank", "ALL")
  const [equippedOnly, setEquippedOnly] = useUrlParamBool("titleEquipped")
  const updateParams = useUrlParams()
  /* Valeur d'URL gardée : un lien trafiqué retombe sur « tous les rangs ». */
  const rank: TitleRankFilter = isTitleRankFilter(rankParam) ? rankParam : "ALL"

  const sorted = useMemo(
    () =>
      [...(titles?.titles ?? [])].sort(
        (left, right) =>
          rankOrder(right) - rankOrder(left) ||
          titleLabel(left).localeCompare(titleLabel(right), undefined, {
            sensitivity: "base",
          })
      ),
    [titles, titleLabel]
  )

  const filtered = useMemo(
    () =>
      filterTitles(sorted, {
        query,
        rank,
        equippedOnly,
        equippedKey: titles?.equippedKey ?? null,
        labelOf: titleLabel,
      }),
    [sorted, query, rank, equippedOnly, titles?.equippedKey, titleLabel]
  )

  if (isLoading) {
    return (
      <PageContainer>
        <p className="py-8 text-sm text-muted-foreground">
          {t("progression.profileTitles.loading")}
        </p>
      </PageContainer>
    )
  }

  if (!titles) return null

  if (sorted.length === 0) {
    return (
      <PageContainer>
        <div className="py-8">
          <EmptyState
            icon={<Crown className="size-6 text-muted-foreground" />}
            title={t("progression.profileTitles.emptyTitle")}
            description={t("progression.profileTitles.emptyDescription")}
          >
            <Button variant="outline" onClick={() => void navigate("/topics")}>
              {t("progression.profileTitles.emptyAction")}
            </Button>
          </EmptyState>
        </div>
      </PageContainer>
    )
  }

  /** Une seule navigation : des appels successifs à `useUrlParam` s'écraseraient. */
  const clearFilters = () =>
    updateParams((params) => {
      params.delete("titleQ")
      params.delete("titleRank")
      params.delete("titleEquipped")
    })

  return (
    <section>
      <StickyHeaderFilters active={stickyActive}>
        {(stacked) => (
          <TitleFilterBar
            query={query}
            onQueryChange={setQuery}
            rank={rank}
            onRankChange={setRank}
            equippedOnly={equippedOnly}
            onEquippedOnlyChange={setEquippedOnly}
            count={filtered.length}
            onClear={clearFilters}
            embedded={stacked}
          />
        )}
      </StickyHeaderFilters>

      <PageContainer>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">
            {t("progression.profileTitles.title")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t("progression.profileTitles.count", { count: sorted.length })}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Crown className="size-6 text-muted-foreground" />}
            title={t("progression.profileTitles.filters.emptyTitle")}
            description={t(
              "progression.profileTitles.filters.emptyDescription"
            )}
          >
            <Button variant="outline" onClick={clearFilters}>
              {t("progression.profileTitles.filters.reset")}
            </Button>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((title) => {
              const equipped = titles.equippedKey === title.key
              const label = titleLabel(title)
              const rankColor = tierColorOf(title.tier)
              return (
                <ExpandableCard
                  key={title.key}
                  title={label}
                  media={
                    /* Titre débloqué par définition : pastille verte à coche, avec le point de
                       rang du palier — même tête de carte que la fiche sujet. */
                    <span className="relative shrink-0">
                      <span
                        className="grid size-9 place-items-center rounded-full"
                        style={TITLE_CARD_ACCENT.acquiredCheck}
                        aria-hidden
                      >
                        <Check className="size-4" strokeWidth={3} />
                      </span>
                      <span
                        className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card"
                        style={{ background: rankColor.fill }}
                        aria-hidden
                      />
                    </span>
                  }
                  defaultExpanded={equipped}
                  style={
                    equipped
                      ? TITLE_CARD_ACCENT.equipped
                      : TITLE_CARD_ACCENT.unlocked
                  }
                >
                  <div className="flex flex-col gap-2.5">
                    <p
                      className="text-xs font-semibold"
                      style={{ color: rankColor.text }}
                    >
                      {t("progression.rarity", {
                        tier: t(masteryTierKeyOf(title.tier)),
                      })}
                    </p>

                    {equipped ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-accent-ink">
                        <Check className="size-3.5" />
                        {t("progression.titleEquipped")}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-success-600">
                        <Check className="size-3.5" />
                        {t("progression.titleUnlocked")}
                      </span>
                    )}

                    <Button
                      size="sm"
                      variant={equipped ? "destructive" : "default"}
                      disabled={equipTitle.isPending}
                      onClick={() =>
                        equipTitle.mutate(equipped ? null : title.key, {
                          onSuccess: () =>
                            showSuccessToast(
                              equipped
                                ? t("progression.toasts.titleRemoved")
                                : t("progression.toasts.titleEquipped")
                            ),
                        })
                      }
                    >
                      {equipped
                        ? t("progression.titleRemove")
                        : t("progression.titleEquip")}
                    </Button>
                  </div>
                </ExpandableCard>
              )
            })}
          </div>
        )}
      </PageContainer>
    </section>
  )
}
