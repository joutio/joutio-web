import { useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmptyState } from "@/shared/components/empty-state"
import { SearchToolbar } from "@/shared/components/search-toolbar"
import { HorizontalRail } from "@/shared/components/horizontal-rail"
import {
  FilterOption,
  FilterSection,
  FilterSections,
} from "@/shared/components/filter-section"
import { PageContainer, useTopicName } from "@/features/shell"
import { normalize } from "@/lib/helpers"
import { useUrlParam, useUrlParams } from "@/shared/hooks/useUrlParam"
import { useServerClock } from "@/shared/clock/useServerClock"
import {
  nearestDeadline,
  useCountdownTicks,
} from "@/shared/hooks/useCountdownTicks"
import type { TranslationKey } from "@/lib/i18n/types"
import { useSocialPending } from "../hooks/useSocialPending"
import {
  PENDING_SORTS,
  PENDING_TYPES,
  isAllPendingTypes,
  isPendingSort,
  parsePendingTypes,
  sortPending,
  togglePendingType,
  type PendingDuel,
  type PendingSort,
  type PendingType,
} from "../domain/pending-duel"
import { PendingDuelList } from "../components/PendingDuelList"

const TYPE_LABEL_KEYS: Record<PendingType, TranslationKey> = {
  received: "social.pending.typeReceived",
  sent: "social.pending.typeSent",
  room: "social.pending.typeRoom",
}

const SORT_LABEL_KEYS: Record<PendingSort, TranslationKey> = {
  EXPIRING: "social.pending.sortExpiring",
  LATEST: "social.pending.sortLatest",
}

/**
 * Page **Défis & Salons** : défis reçus, défis envoyés et salons ouverts, avec une **barre de
 * filtres unique** (recherche sujet/joueur, type, tri par échéance). Chaque groupe se parcourt
 * dans un rail **horizontal** (`HorizontalRail` : Arc `ScrollArea` en desktop, scroller natif
 * full-bleed en compact/tablette) : les listes longues ne repoussent plus les sections suivantes
 * vers le bas. Une seule source de tic-tac par écran : l'échéance la plus proche des éléments
 * visibles.
 */
export function ChallengesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const resolveName = useTopicName()
  const { received, sent, rooms, isLoading } = useSocialPending()
  const { serverNow } = useServerClock()

  const [query, setQuery] = useUrlParam<string>("q", "")
  const [rawType] = useUrlParam<string>("type", "")
  const [rawSort, setSort] = useUrlParam<string>("sort", "EXPIRING")
  // Carte ciblée par un toast de défi : scroll + surbrillance éphémère, puis retrait de l'URL.
  const [targetChallenge, setTargetChallenge] = useUrlParam<string>(
    "challenge",
    ""
  )
  const scrolledChallenge = useRef<string | null>(null)
  const types = useMemo(() => parsePendingTypes(rawType), [rawType])
  const sort = isPendingSort(rawSort) ? rawSort : "EXPIRING"
  const updateParams = useUrlParams()

  const filtered = useMemo(() => {
    const needle = normalize(query)
    const selected = new Set(types)
    const matches = (item: PendingDuel) => {
      if (!needle) return true
      const topic = resolveName(item.topic.names)
      const player = item.player?.pseudonym ?? ""
      return normalize(`${topic} ${player}`).includes(needle)
    }

    return {
      received: selected.has("received")
        ? sortPending(received.filter(matches), sort)
        : [],
      sent: selected.has("sent") ? sortPending(sent.filter(matches), sort) : [],
      rooms: selected.has("room")
        ? sortPending(rooms.filter(matches), sort)
        : [],
    }
  }, [query, received, resolveName, rooms, sent, sort, types])

  const visible = useMemo(
    () => [...filtered.received, ...filtered.sent, ...filtered.rooms],
    [filtered]
  )
  const nextDeadline = useMemo(
    () => nearestDeadline(visible.map((item) => item.expiresAt)),
    [visible]
  )
  useCountdownTicks({ deadlineAt: nextDeadline, clock: serverNow })

  // Arrivée depuis un toast de défi : cible la carte dès qu'elle est rendue (les données
  // peuvent arriver après le montage), puis retire le paramètre après la surbrillance.
  useEffect(() => {
    if (!targetChallenge) {
      scrolledChallenge.current = null
      return
    }
    if (scrolledChallenge.current === targetChallenge) return
    const card = document.getElementById(`challenge-${targetChallenge}`)
    if (!card) return
    scrolledChallenge.current = targetChallenge
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    card.scrollIntoView?.({
      block: "center",
      inline: "center",
      behavior: reduceMotion ? "auto" : "smooth",
    })
  }, [filtered.received, targetChallenge])

  useEffect(() => {
    if (!targetChallenge) return
    const timer = window.setTimeout(() => setTargetChallenge(""), 2_500)
    return () => window.clearTimeout(timer)
  }, [setTargetChallenge, targetChallenge])

  const hasPending = received.length + sent.length + rooms.length > 0
  const filteredTotal = visible.length
  const allTypes = isAllPendingTypes(types)
  const activeCount =
    (query ? 1 : 0) + (allTypes ? 0 : 1) + (sort === "EXPIRING" ? 0 : 1)

  const setTypes = (next: PendingType[]) =>
    updateParams((params) => {
      if (isAllPendingTypes(next)) params.delete("type")
      else params.set("type", next.join(","))
    })
  const selectAllTypes = () => setTypes([...PENDING_TYPES])
  const toggleType = (value: PendingType) =>
    setTypes(togglePendingType(types, value))
  const clearFilters = () =>
    updateParams((params) => {
      params.delete("q")
      params.delete("type")
      params.delete("sort")
    })

  const typeOptions = PENDING_TYPES.map((value) => ({
    value,
    label: t(TYPE_LABEL_KEYS[value]),
  }))
  const sortOptions = PENDING_SORTS.map((value) => ({
    value,
    label: t(SORT_LABEL_KEYS[value]),
  }))
  const typeLabel = allTypes
    ? t("social.pending.typeAll")
    : typeOptions
        .filter((option) => types.includes(option.value))
        .map((option) => option.label)
        .join(" + ")
  const sortLabel = t(SORT_LABEL_KEYS[sort])

  const section = (
    title: string,
    items: PendingDuel[],
    highlightedId?: string | null
  ) => (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <HorizontalRail
        label={title}
        viewportClassName="pb-3"
        scrollPaddingInline="0.375rem"
        wheelToHorizontal
        snap="x proximity"
      >
        <PendingDuelList items={items} highlightedId={highlightedId} />
      </HorizontalRail>
    </section>
  )

  return (
    <>
      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder={t("social.pending.searchPlaceholder")}
        leading={
          <>
            <Toggle
              variant="outline"
              size="sm"
              pressed={allTypes}
              onPressedChange={selectAllTypes}
            >
              {t("social.pending.typeAll")}
            </Toggle>
            {typeOptions.map((option) => (
              <Toggle
                key={option.value}
                variant="outline"
                size="sm"
                pressed={types.includes(option.value)}
                onPressedChange={() => toggleType(option.value)}
              >
                {option.label}
              </Toggle>
            ))}
          </>
        }
        controls={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as PendingSort)}
          >
            <SelectTrigger
              size="sm"
              className="w-[190px]"
              aria-label={t("social.pending.sortAria")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        filters={
          <FilterSections defaultOpen="type">
            <FilterSection
              value="type"
              title={t("social.pending.filterType")}
              summary={typeLabel}
            >
              <FilterOption selected={allTypes} onSelect={selectAllTypes}>
                {t("social.pending.typeAll")}
              </FilterOption>
              {typeOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={types.includes(option.value)}
                  onSelect={() => toggleType(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
            <FilterSection
              value="sort"
              title={t("social.pending.filterSort")}
              summary={sortLabel}
            >
              {sortOptions.map((option) => (
                <FilterOption
                  key={option.value}
                  selected={sort === option.value}
                  onSelect={() => setSort(option.value)}
                >
                  {option.label}
                </FilterOption>
              ))}
            </FilterSection>
          </FilterSections>
        }
        activeCount={activeCount}
        onClear={clearFilters}
        count={filteredTotal}
        countLabel={t("social.pending.countLabel")}
      />

      <PageContainer>
        {isLoading && !hasPending ? (
          <p className="text-sm text-muted-foreground">
            {t("common.app.loading")}
          </p>
        ) : !hasPending ? (
          <EmptyState
            icon={<Inbox className="size-6 text-muted-foreground" />}
            title={t("social.pending.emptyAllTitle")}
            description={t("social.pending.emptyAllDescription")}
          >
            <Button variant="outline" onClick={() => void navigate("/topics")}>
              {t("social.exploreTopics")}
            </Button>
          </EmptyState>
        ) : filteredTotal === 0 ? (
          <EmptyState
            icon={<Inbox className="size-6 text-muted-foreground" />}
            title={t("social.pending.filteredEmptyTitle")}
            description={t("social.pending.filteredEmptyDescription")}
          >
            <Button variant="outline" onClick={clearFilters}>
              {t("shared.searchToolbar.clearAll")}
            </Button>
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-8 compact:gap-6">
            {filtered.received.length > 0 &&
              section(
                t("social.challenges.receivedGroup", {
                  count: filtered.received.length,
                }),
                filtered.received,
                targetChallenge
              )}
            {filtered.sent.length > 0 &&
              section(
                t("social.challenges.sentGroup", {
                  count: filtered.sent.length,
                }),
                filtered.sent
              )}
            {filtered.rooms.length > 0 &&
              section(
                t("social.rooms.group", { count: filtered.rooms.length }),
                filtered.rooms
              )}
          </div>
        )}
      </PageContainer>
    </>
  )
}
