import { useTranslation } from "react-i18next"
import { CrownIcon } from "@phosphor-icons/react"
import { Toggle } from "@/components/ui/toggle"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import { TITLE_RANK_FILTERS, type TitleRankFilter } from "../domain/progression"
import { masteryTierKeyOf } from "./labels"

interface TitleFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  rank: TitleRankFilter
  onRankChange: (value: TitleRankFilter) => void
  equippedOnly: boolean
  onEquippedOnlyChange: (value: boolean) => void
  /** Nombre de titres affichés (compteur du bandeau). */
  count: number
  onClear: () => void
  /** Portée par le header sticky de l'onglet (pas de chrome propre). */
  embedded?: boolean
}

/**
 * Bandeau de l'onglet **Titres** du profil — filtre **client** (tous les titres débloqués sont
 * déjà chargés) : recherche sur le libellé et le nom du sujet, rang de maîtrise et titre porté.
 * Même chrome que les catalogues (`SearchToolbar`) : champ de recherche + puces de rang en
 * tablette/desktop, bouton « Filtres » (bottom sheet Arc) en tactile.
 */
export function TitleFilterBar({
  query,
  onQueryChange,
  rank,
  onRankChange,
  equippedOnly,
  onEquippedOnlyChange,
  count,
  onClear,
  embedded = false,
}: TitleFilterBarProps) {
  const { t } = useTranslation()
  const activeCount =
    (query ? 1 : 0) + (rank === "ALL" ? 0 : 1) + (equippedOnly ? 1 : 0)

  const rankLabel = (value: TitleRankFilter) =>
    value === "ALL"
      ? t("progression.profileTitles.filters.allRanks")
      : t(masteryTierKeyOf(value))

  return (
    <SearchToolbar
      query={query}
      onQueryChange={onQueryChange}
      placeholder={t("progression.profileTitles.searchPlaceholder")}
      leading={
        <Toggle
          variant="outline"
          size="sm"
          pressed={equippedOnly}
          onPressedChange={() => onEquippedOnlyChange(!equippedOnly)}
        >
          <CrownIcon />
          {t("progression.profileTitles.filters.equippedOnly")}
        </Toggle>
      }
      facets={TITLE_RANK_FILTERS.map((value) => (
        <Toggle
          key={value}
          variant="outline"
          size="sm"
          pressed={rank === value}
          onPressedChange={() => onRankChange(value)}
        >
          {rankLabel(value)}
        </Toggle>
      ))}
      filters={
        <FilterSections defaultOpen="rank">
          <FilterSection
            value="rank"
            title={t("progression.profileTitles.filters.rankTitle")}
            summary={rankLabel(rank)}
          >
            {TITLE_RANK_FILTERS.map((value) => (
              <FilterOption
                key={value}
                selected={rank === value}
                onSelect={() => onRankChange(value)}
              >
                {rankLabel(value)}
              </FilterOption>
            ))}
          </FilterSection>
          <FilterSection
            value="display"
            title={t("progression.profileTitles.filters.displayTitle")}
            summary={
              equippedOnly
                ? t("progression.profileTitles.filters.equippedOnly")
                : undefined
            }
          >
            <FilterOption
              selected={equippedOnly}
              onSelect={() => onEquippedOnlyChange(!equippedOnly)}
            >
              <CrownIcon className="size-4" />
              {t("progression.profileTitles.filters.equippedOnly")}
            </FilterOption>
          </FilterSection>
        </FilterSections>
      }
      activeCount={activeCount}
      onClear={onClear}
      count={count}
      countLabel={t("progression.profileTitles.countLabel")}
      embedded={embedded}
    />
  )
}
