import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect"
import { useScrollContainer } from "@/shared/hooks/useScrollContainer"
import { StickyHeaderFilters } from "@/shared/components/sticky-header-stack"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import { PageContainer } from "@/features/shell"
import { MatchList } from "./MatchList"
import { GameHistoryToolbar } from "./GameHistoryToolbar"
import { useGameHistory } from "../hooks/usePlayer"
import {
  isGameHistorySort,
  isGameOpponentTypeFilter,
  isGameOutcomeFilter,
} from "../domain/history"

interface GameHistorySectionProps {
  /** Joueur consulté (`GET /api/profiles/{id}/games`). */
  userId: string
  /** Scope serveur : sujet d'une fiche sujet. */
  topicId?: string
  /**
   * Adversaire **imposé** (profil d'un autre joueur) : seuls les duels entre le viewer et ce
   * joueur sont listés, sans filtre de type ni bascule. Absent sur son propre profil et sur une
   * fiche sujet.
   */
  opponentId?: string
  /**
   * Affiche l'adversaire dans chaque carte. Masqué par défaut quand `opponentId` impose déjà le
   * scope « Tes duels contre X ».
   */
  showOpponent?: boolean
  /** État vide **sans filtre** (aucune partie du tout) — propre à l'écran. */
  empty: ReactNode
  /**
   * L'onglet est actif : sa barre de filtres peut être portée dans le header sticky de la page.
   * Sans header partagé (fiche joueur, tests), la barre reste rendue sur place.
   */
  stickyActive?: boolean
}

const SKELETON_ROWS = 5

/**
 * Historique des parties d'un joueur : **liste complète** (scroll infini) avec filtres (issue,
 * type d'adversaire sur son propre profil / une fiche sujet) et tri — appliqués **côté serveur**,
 * la pagination reste donc exacte. Sur la fiche d'un autre joueur, `opponentId` **impose** le
 * scope viewer ↔ joueur et masque le filtre de type. Filtres et tri sont **persistés dans
 * l'URL** : un retour restaure l'écran à l'identique et l'état est partageable. Un filtre actif
 * sans résultat propose de les effacer ; sans aucun filtre, l'écran fournit son propre état vide
 * (`empty`).
 */
export function GameHistorySection({
  userId,
  topicId,
  opponentId,
  showOpponent = !opponentId,
  empty,
  stickyActive = true,
}: GameHistorySectionProps) {
  const { t } = useTranslation()
  const [outcomeParam, setOutcome] = useUrlParam<string>("outcome", "ALL")
  const [opponentTypeParam, setOpponentType] = useUrlParam<string>(
    "opponentType",
    "ALL"
  )
  const [sortParam, setSort] = useUrlParam<string>("sort", "RECENT")
  /* Valeurs d'URL gardées : un lien trafiqué retombe sur le défaut au lieu de partir au BFF. */
  const outcome = isGameOutcomeFilter(outcomeParam) ? outcomeParam : "ALL"
  const opponentType = isGameOpponentTypeFilter(opponentTypeParam)
    ? opponentTypeParam
    : "ALL"
  const sort = isGameHistorySort(sortParam) ? sortParam : "RECENT"
  const hasForcedOpponent = Boolean(opponentId)
  const showOpponentType = !hasForcedOpponent
  const updateParams = useUrlParams()
  const scrollContainer = useScrollContainer()

  const history = useGameHistory(userId, {
    topicId,
    opponentId,
    outcome,
    opponentType:
      showOpponentType && opponentType !== "ALL" ? opponentType : undefined,
    sort,
  })

  const activeCount =
    (outcome !== "ALL" ? 1 : 0) +
    (showOpponentType && opponentType !== "ALL" ? 1 : 0) +
    (sort !== "RECENT" ? 1 : 0)

  /** Une seule navigation : effacer plusieurs paramètres en appels successifs s'écraserait. */
  const clearFilters = () =>
    updateParams((params) => {
      params.delete("outcome")
      params.delete("opponentType")
      params.delete("sort")
      // Nettoie l'ancien paramètre « Contre moi » des URLs partagées.
      params.delete("opponent")
    })

  const sentinelRef = useLoadMoreOnIntersect({
    enabled: history.hasNextPage && !history.isFetchingNextPage,
    onLoadMore: history.fetchNextPage,
    rootRef: scrollContainer,
  })

  return (
    <>
      <StickyHeaderFilters active={stickyActive}>
        {(stacked) => (
          <GameHistoryToolbar
            outcome={outcome}
            onOutcomeChange={setOutcome}
            opponentType={opponentType}
            onOpponentTypeChange={setOpponentType}
            sort={sort}
            onSortChange={setSort}
            showOpponentType={showOpponentType}
            count={history.total}
            activeCount={activeCount}
            onClear={clearFilters}
            embedded={stacked}
          />
        )}
      </StickyHeaderFilters>

      <PageContainer>
        {history.isLoading ? (
          <div className="flex flex-col gap-2.5" aria-busy="true">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-card bg-muted/50"
              />
            ))}
          </div>
        ) : history.isError ? (
          <EmptyState
            title={t("history.error")}
            description={t("history.emptyFilteredDescription")}
          >
            <Button variant="outline" onClick={history.refetch}>
              {t("history.retry")}
            </Button>
          </EmptyState>
        ) : history.items.length === 0 ? (
          activeCount > 0 ? (
            <EmptyState
              title={t("history.emptyFilteredTitle")}
              description={t("history.emptyFilteredDescription")}
            >
              <Button variant="outline" onClick={clearFilters}>
                {t("history.reset")}
              </Button>
            </EmptyState>
          ) : (
            <>{empty}</>
          )
        ) : (
          <>
            <MatchList items={history.items} showOpponent={showOpponent} />

            {history.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {history.isFetchingNextPage && (
              <div className="mt-2.5 flex flex-col gap-2.5" aria-busy="true">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-card bg-muted/50"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageContainer>
    </>
  )
}
