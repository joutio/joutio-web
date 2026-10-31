import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"
import { EmptyState } from "@/shared/components/empty-state"
import { StickyHeaderFilters } from "@/shared/components/sticky-header-stack"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import { PageContainer } from "@/features/shell"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import {
  BADGE_FAMILIES,
  filterBadgeFamilies,
  isBadgeStateFilter,
  type BadgeCollection,
  type BadgeFamily,
  type BadgeItem,
} from "../domain/progression"
import { BadgeDetail } from "./BadgeDetail"
import { BadgeFilterBar } from "./BadgeFilterBar"
import { BadgeRail } from "./BadgeRail"
import { badgeLabelKey, FAMILY_KEYS } from "./labels"

interface BadgeCollectionSectionProps {
  /** `undefined` tant que la collection n'est pas chargée : la section est masquée. */
  collection: BadgeCollection | undefined
  /** L'onglet est actif : sa barre de filtres peut rejoindre le header sticky partagé. */
  stickyActive?: boolean
}

/**
 * Collection de badges d'un joueur : **tout** le catalogue, une section par famille (`VOLUME ·
 * 3 sur 7 débloqués`) et les sept paliers en **rail horizontal à toutes les tailles**.
 * Le bandeau filtre **côté client** (le catalogue est déjà chargé) par libellé et par état ; les
 * familles sans résultat disparaissent. La fiche d'un badge (critère d'obtention + progression)
 * s'ouvre dans une **modale unique** — bottom sheet Arc en tactile.
 */
export function BadgeCollectionSection({
  collection,
  stickyActive = true,
}: BadgeCollectionSectionProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useUrlParam<string>("q", "")
  const [stateParam, setState] = useUrlParam<string>("state", "ALL")
  /* Valeur d'URL gardée : un lien trafiqué retombe sur « tous ». */
  const state = isBadgeStateFilter(stateParam) ? stateParam : "ALL"
  const updateParams = useUrlParams()
  const [selected, setSelected] = useState<{
    badge: BadgeItem
    family: BadgeFamily
  } | null>(null)

  const ordered = useMemo(
    () =>
      BADGE_FAMILIES.map((family) =>
        collection?.families.find((group) => group.family === family)
      ).filter((group) => group !== undefined),
    [collection]
  )

  /** Libellé affiché d'un badge : traduction connue du web, sinon libellé du serveur. */
  const labelOf = useMemo(
    () => (badge: BadgeItem) => {
      const key = badgeLabelKey(badge.code)
      return key ? t(key) : badge.label
    },
    [t]
  )

  if (!collection) return null

  const filtered = filterBadgeFamilies(ordered, { query, state, labelOf })
  const shown = filtered.reduce(
    (total, group) => total + group.badges.length,
    0
  )
  const totalsOf = new Map(
    ordered.map((group) => [
      group.family,
      {
        earned: group.badges.filter((badge) => badge.earned).length,
        total: group.badges.length,
      },
    ])
  )

  /** Une seule navigation : deux appels successifs partageraient la même base de render. */
  const clearFilters = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("state")
    })

  return (
    <section>
      {/* Bande de filtres **au contact des onglets** : portée dans le header sticky partagé par
          `StickyHeaderFilters` (ou rendue sur place hors pile, ex. tests). */}
      <StickyHeaderFilters active={stickyActive}>
        {(stacked) => (
          <BadgeFilterBar
            query={query}
            onQueryChange={setQuery}
            state={state}
            onStateChange={setState}
            count={shown}
            onClear={clearFilters}
            embedded={stacked}
          />
        )}
      </StickyHeaderFilters>

      <PageContainer>
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-base font-semibold">
            {t("progression.badgesTitle")}
          </h2>
          <span className="text-xs text-muted-foreground">
            {t("progression.badgesCount", {
              earned: collection.earnedCount,
              total: collection.totalCount,
            })}
          </span>
        </div>

        {shown === 0 ? (
          <EmptyState
            title={t("progression.badgesFilter.emptyTitle")}
            description={t("progression.badgesFilter.emptyDescription")}
          >
            <Button variant="outline" onClick={clearFilters}>
              {t("progression.badgesFilter.reset")}
            </Button>
          </EmptyState>
        ) : (
          <div className="space-y-5">
            {filtered.map((group) => {
              const totals = totalsOf.get(group.family)
              return (
                <div key={group.family} className="space-y-2">
                  <h3 className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold tracking-wide uppercase">
                      {t(FAMILY_KEYS[group.family])}
                    </span>
                    {totals && (
                      <span className="text-2xs text-muted-foreground font-mono tabular-nums">
                        {t("progression.badgesCount", {
                          earned: totals.earned,
                          total: totals.total,
                        })}
                      </span>
                    )}
                  </h3>
                  <BadgeRail
                    family={group.family}
                    badges={group.badges}
                    onOpen={(badge) =>
                      setSelected({ badge, family: group.family })
                    }
                    label={t(FAMILY_KEYS[group.family])}
                  />
                </div>
              )
            })}
          </div>
        )}
      </PageContainer>

      <AppDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? labelOf(selected.badge) : ""}
        sheetOnTouch
        sheetDetents={SHEET_DETENTS.badge}
      >
        {selected && (
          <BadgeDetail badge={selected.badge} family={selected.family} />
        )}
      </AppDialog>
    </section>
  )
}
