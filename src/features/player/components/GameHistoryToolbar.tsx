import { useTranslation } from "react-i18next"
import type { TranslationKey } from "@/lib/i18n/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import {
  GAME_HISTORY_SORTS,
  GAME_OUTCOME_FILTERS,
  type GameHistorySort,
  type GameOpponentTypeFilter,
  type GameOutcomeFilter,
} from "../domain/history"

/** Libellé d'une issue (`topic.matchList.outcomes.*`) — même vocabulaire que les lignes. */
const OUTCOME_LABEL_KEYS: Record<GameOutcomeFilter, TranslationKey> = {
  ALL: "history.outcomeAll",
  WIN: "topic.matchList.outcomes.win",
  LOSS: "topic.matchList.outcomes.loss",
  DRAW: "topic.matchList.outcomes.draw",
  WAITING: "topic.matchList.outcomes.waiting",
  IN_PROGRESS: "topic.matchList.outcomes.inProgress",
  CANCELLED: "topic.matchList.outcomes.cancelled",
}

const SORT_LABEL_KEYS: Record<GameHistorySort, TranslationKey> = {
  RECENT: "history.sortRecent",
  OLDEST: "history.sortOldest",
  SCORE: "history.sortScore",
}

const OPPONENT_TYPE_KEYS: Record<GameOpponentTypeFilter, TranslationKey> = {
  ALL: "history.opponentAll",
  HUMAN: "history.opponentHuman",
  BOT: "history.opponentBot",
}

const OPPONENT_TYPE_FILTERS: readonly GameOpponentTypeFilter[] = [
  "ALL",
  "HUMAN",
  "BOT",
]

interface GameHistoryToolbarProps {
  outcome: GameOutcomeFilter
  onOutcomeChange: (value: GameOutcomeFilter) => void
  opponentType: GameOpponentTypeFilter
  onOpponentTypeChange: (value: GameOpponentTypeFilter) => void
  sort: GameHistorySort
  onSortChange: (value: GameHistorySort) => void
  /**
   * Filtre « type d'adversaire » visible sur son propre profil / une fiche sujet ; masqué sur
   * la fiche d'un autre joueur (seuls les duels contre ce joueur sont affichés).
   */
  showOpponentType?: boolean
  /** Nombre de parties de l'historique (compteur serveur). */
  count: number
  activeCount: number
  onClear: () => void
  /** Portée par le header sticky de l'onglet (pas de chrome propre). */
  embedded?: boolean
}

/**
 * Barre de l'historique des parties — **même chrome que les catalogues** (`SearchToolbar`) :
 * filtres + tri sur bande collante en tablette/desktop, bouton « Filtres » ouvrant un bottom
 * sheet Arc en tactile. Aucune recherche textuelle : la barre reste une barre de **filtres**.
 * Sur la fiche d'un autre joueur, le type d'adversaire est masqué (`showOpponentType=false`).
 * Les valeurs par défaut (`Toutes les issues`, `Tous les adversaires`, `Plus récentes`) sont
 * retirées de l'URL par l'appelant.
 */
export function GameHistoryToolbar({
  outcome,
  onOutcomeChange,
  opponentType,
  onOpponentTypeChange,
  sort,
  onSortChange,
  showOpponentType = true,
  count,
  activeCount,
  onClear,
  embedded = false,
}: GameHistoryToolbarProps) {
  const { t } = useTranslation()

  const selects = (
    <>
      <Select
        value={outcome}
        onValueChange={(value) => onOutcomeChange(value as GameOutcomeFilter)}
      >
        <SelectTrigger
          size="sm"
          className="w-[190px]"
          aria-label={t("history.outcomeAria")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GAME_OUTCOME_FILTERS.map((value) => (
            <SelectItem key={value} value={value}>
              {t(OUTCOME_LABEL_KEYS[value])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showOpponentType && (
        <Select
          value={opponentType}
          onValueChange={(value) =>
            onOpponentTypeChange(value as GameOpponentTypeFilter)
          }
        >
          <SelectTrigger
            size="sm"
            className="w-[190px]"
            aria-label={t("history.opponentTypeAria")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPPONENT_TYPE_FILTERS.map((value) => (
              <SelectItem key={value} value={value}>
                {t(OPPONENT_TYPE_KEYS[value])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={sort}
        onValueChange={(value) => onSortChange(value as GameHistorySort)}
      >
        <SelectTrigger
          size="sm"
          className="w-[190px]"
          aria-label={t("history.sortAria")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GAME_HISTORY_SORTS.map((value) => (
            <SelectItem key={value} value={value}>
              {t(SORT_LABEL_KEYS[value])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  const sheets = (
    <FilterSections defaultOpen="outcome">
      <FilterSection
        value="outcome"
        title={t("history.outcome")}
        summary={t(OUTCOME_LABEL_KEYS[outcome])}
      >
        {GAME_OUTCOME_FILTERS.map((value) => (
          <FilterOption
            key={value}
            selected={outcome === value}
            onSelect={() => onOutcomeChange(value)}
          >
            {t(OUTCOME_LABEL_KEYS[value])}
          </FilterOption>
        ))}
      </FilterSection>

      {showOpponentType && (
        <FilterSection
          value="opponentType"
          title={t("history.opponentType")}
          summary={t(OPPONENT_TYPE_KEYS[opponentType])}
        >
          {OPPONENT_TYPE_FILTERS.map((value) => (
            <FilterOption
              key={value}
              selected={opponentType === value}
              onSelect={() => onOpponentTypeChange(value)}
            >
              {t(OPPONENT_TYPE_KEYS[value])}
            </FilterOption>
          ))}
        </FilterSection>
      )}

      <FilterSection
        value="sort"
        title={t("history.sort")}
        summary={t(SORT_LABEL_KEYS[sort])}
      >
        {GAME_HISTORY_SORTS.map((value) => (
          <FilterOption
            key={value}
            selected={sort === value}
            onSelect={() => onSortChange(value)}
          >
            {t(SORT_LABEL_KEYS[value])}
          </FilterOption>
        ))}
      </FilterSection>
    </FilterSections>
  )

  return (
    <SearchToolbar
      controls={selects}
      filters={sheets}
      activeCount={activeCount}
      onClear={onClear}
      count={count}
      countLabel={t("history.countLabel")}
      embedded={embedded}
    />
  )
}
