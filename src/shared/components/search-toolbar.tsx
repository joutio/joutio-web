import type { ReactNode } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  BottomSheet,
  BottomSheetClose,
} from "@/components/arc/bottom-sheet/bottom-sheet"
import { useIsTouchLayout } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"

/**
 * Barre de filtres partagée Sujets / Social — composants shadcn natifs.
 * Desktop : bande collante sous la topbar (recherche + chips + selects + facettes).
 * Tactile (compact/tablette) : une seule ligne `recherche + bouton Filtres` ouvrant le bottom
 * sheet Arc UI (drags/peek, `detents`) ; le contenu du sheet est fourni par `filters`.
 */
interface SearchToolbarProps {
  /** Champ de recherche — omis : barre de filtres seule (historique des parties). */
  query?: string
  onQueryChange?: (value: string) => void
  placeholder?: string
  leading?: ReactNode
  controls?: ReactNode
  facets?: ReactNode
  /** Contenu du drawer de filtres mobile (sections `FilterSection`). */
  filters?: ReactNode
  activeCount: number
  onClear: () => void
  count: number
  countLabel: string
  /**
   * Barre portée par un header sticky parent (`StickyHeaderFilters`) : pas de position sticky,
   * ni de fond/bordure propres — le parent porte le verre et la bordure basse.
   */
  embedded?: boolean
}

export function SearchToolbar({
  query,
  onQueryChange,
  placeholder,
  leading,
  controls,
  facets,
  filters,
  activeCount,
  onClear,
  count,
  countLabel,
  embedded = false,
}: SearchToolbarProps) {
  const { t } = useTranslation()
  const isTouch = useIsTouchLayout()
  const countLabelFull = t(
    count > 1
      ? "shared.searchToolbar.countPlural"
      : "shared.searchToolbar.count",
    { count, label: countLabel }
  )
  const matchesLabel = t(
    count > 1
      ? "shared.searchToolbar.matchingPlural"
      : "shared.searchToolbar.matching",
    { count, label: countLabel }
  )
  const stickyTop =
    "top-[calc(var(--qu-topbar-offset,0rem)_+_var(--qu-chrome-shift,0px))]"
  const scrollMarginTop =
    "scroll-mt-[calc(var(--qu-topbar-offset,0rem)_+_var(--qu-chrome-shift,0px))]"
  const chromeClass = embedded
    ? undefined
    : cn("qu-scroll-chrome qu-sticky-follow sticky z-10 border-b", stickyTop)

  /* Barre de **filtres** seule (sans recherche) : même chrome, la place de la recherche porte le
     compteur — l'écran n'a pas de requête textuelle à saisir. */
  const searchField =
    query !== undefined && onQueryChange ? (
      <div className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            // Entrée replie le clavier mobile (la recherche est déjà live).
            if (event.key === "Enter") event.currentTarget.blur()
          }}
          enterKeyHint="search"
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    ) : null

  if (isTouch) {
    return (
      <div className={chromeClass} data-slot="search-toolbar">
        <div className="flex items-center gap-2 px-(--page-gutter-x) py-2.5">
          {searchField ? (
            <div className="min-w-0 flex-1">{searchField}</div>
          ) : (
            <span className="min-w-0 flex-1 text-xs text-muted-foreground">
              {countLabelFull}
            </span>
          )}
          {filters && (
            <BottomSheet
              title={t("shared.searchToolbar.filters")}
              description={matchesLabel}
              detents={SHEET_DETENTS.filters}
              trigger={
                <button
                  type="button"
                  aria-label={
                    activeCount > 0
                      ? t(
                          activeCount > 1
                            ? "shared.searchToolbar.filtersActivePlural"
                            : "shared.searchToolbar.filtersActive",
                          { count: activeCount }
                        )
                      : t("shared.searchToolbar.filters")
                  }
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "relative shrink-0"
                  )}
                >
                  <SlidersHorizontal className="size-4" />
                  {activeCount > 0 && (
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-heading text-2xs font-bold text-primary-foreground">
                      {activeCount}
                    </span>
                  )}
                </button>
              }
              footer={
                <div className="flex gap-2">
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={onClear}
                      className={cn(
                        buttonVariants({ variant: "destructive" }),
                        "flex-1 gap-1.5"
                      )}
                    >
                      <X /> {t("shared.searchToolbar.clearAll")}
                    </button>
                  )}
                  <BottomSheetClose asChild>
                    <button
                      type="button"
                      className={cn(buttonVariants(), "flex-1")}
                    >
                      {t("shared.searchToolbar.viewResults")}
                    </button>
                  </BottomSheetClose>
                </div>
              }
            >
              {filters}
            </BottomSheet>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(chromeClass, !embedded && scrollMarginTop)}
      data-slot="search-toolbar"
    >
      <div className="mx-auto w-full max-w-screen-xl px-(--page-gutter-x) py-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {searchField && (
            <div className="relative w-[300px] max-w-full">{searchField}</div>
          )}
          {leading}
          {controls}

          <div className="flex-1" />

          <span className="text-xs text-muted-foreground">
            {countLabelFull}
          </span>
          {activeCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClear}>
              <X /> {t("shared.searchToolbar.clearAll")}
            </Button>
          )}
        </div>

        {facets && (
          <div className="qu-hide-scrollbar mt-3 flex items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5">
            {facets}
          </div>
        )}
      </div>
    </div>
  )
}
