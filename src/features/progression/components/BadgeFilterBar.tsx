import { useTranslation } from "react-i18next"
import { Check, Lock } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import {
  BADGE_STATE_FILTERS,
  type BadgeStateFilter,
} from "../domain/progression"

interface BadgeFilterBarProps {
  query: string
  onQueryChange: (value: string) => void
  state: BadgeStateFilter
  onStateChange: (value: BadgeStateFilter) => void
  /** Nombre de badges affichés (compteur du bandeau). */
  count: number
  onClear: () => void
  /** Portée par le header sticky de l'onglet (pas de chrome propre). */
  embedded?: boolean
}

/**
 * Bandeau de la collection de badges — **filtre client** (le catalogue complet est déjà chargé,
 * aucun appel serveur) : recherche sur le libellé et état du palier. Même chrome que les
 * catalogues (`SearchToolbar`) : bande collante avec puces en tablette/desktop, champ de recherche
 * + bouton « Filtres » (bottom sheet Arc, section *État*) en tactile.
 */
export function BadgeFilterBar({
  query,
  onQueryChange,
  state,
  onStateChange,
  count,
  onClear,
  embedded = false,
}: BadgeFilterBarProps) {
  const { t } = useTranslation()
  const activeCount = (query ? 1 : 0) + (state === "ALL" ? 0 : 1)

  const stateLabel = (value: BadgeStateFilter) =>
    t(
      value === "EARNED"
        ? "progression.badgesFilter.stateEarned"
        : value === "TO_UNLOCK"
          ? "progression.badgesFilter.stateToUnlock"
          : "progression.badgesFilter.stateAll"
    )

  const chips = (
    <>
      {BADGE_STATE_FILTERS.map((value) => (
        <Toggle
          key={value}
          variant="outline"
          size="sm"
          pressed={state === value}
          onPressedChange={() => onStateChange(value)}
        >
          {value === "EARNED" && <Check />}
          {value === "TO_UNLOCK" && <Lock />}
          {stateLabel(value)}
        </Toggle>
      ))}
    </>
  )

  return (
    <SearchToolbar
      query={query}
      onQueryChange={onQueryChange}
      placeholder={t("progression.badgesFilter.searchPlaceholder")}
      leading={chips}
      filters={
        <FilterSections defaultOpen="state">
          <FilterSection
            value="state"
            title={t("progression.badgesFilter.stateTitle")}
            summary={stateLabel(state)}
          >
            {BADGE_STATE_FILTERS.map((value) => (
              <FilterOption
                key={value}
                selected={state === value}
                onSelect={() => onStateChange(value)}
              >
                {stateLabel(value)}
              </FilterOption>
            ))}
          </FilterSection>
        </FilterSections>
      }
      activeCount={activeCount}
      onClear={onClear}
      count={count}
      countLabel={t("progression.badgesFilter.countLabel")}
      embedded={embedded}
    />
  )
}
