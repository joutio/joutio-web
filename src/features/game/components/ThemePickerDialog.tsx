import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Loader2, Search } from "lucide-react"
import { AppDialog } from "@/shared/components/app-dialog"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTopicsList } from "@/features/topics"
import { useDevice } from "@/shared/hooks/use-device"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect"
import { ThemeSelectRow } from "./ThemeSelectRow"

interface ThemePickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (topicId: string) => void
  title?: string
  sub?: string
  /** Requête de création en cours : la feuille reste ouverte jusqu'à la redirection. */
  pending?: boolean
}

/**
 * Sélecteur de thème du défi nominatif : liste de thèmes au **même format que le wizard**
 * (lignes neutres + radio, pas de cartes de catalogue), recherche serveur (`GET /api/topics?q=`,
 * tri popularité) et confirmation par « Lancer ». En compact, le champ de recherche est épinglé
 * en bas du dialog (au-dessus des actions, sur sa propre ligne).
 */
export function ThemePickerDialog({
  open,
  onClose,
  onSelect,
  title,
  sub,
  pending = false,
}: ThemePickerDialogProps) {
  const { t } = useTranslation()
  const compact = useDevice() === "compact"
  const [query, setQuery] = useState("")
  const [selectedTopicId, setSelectedTopicId] = useState("")
  const debounced = useDebounce(query, 250)

  /** Repart d'une sélection vierge à la fermeture ; un échec de création conserve le choix. */
  function reset() {
    setQuery("")
    setSelectedTopicId("")
  }

  function close() {
    if (pending) return
    reset()
    onClose()
  }

  const topicsQuery = useTopicsList({
    q: debounced,
    sort: "POPULAR",
  })
  const topics = topicsQuery.data?.pages.flatMap((page) => page.content) ?? []

  // Scroll infini : charge la page suivante quand la sentinelle approche.
  const sentinelRef = useLoadMoreOnIntersect({
    enabled: topicsQuery.hasNextPage && !topicsQuery.isFetchingNextPage,
    onLoadMore: () => void topicsQuery.fetchNextPage(),
  })

  function launch() {
    if (pending || !selectedTopicId) return
    // Replie le clavier mobile pour libérer l'écran avant de continuer.
    ;(document.activeElement as HTMLElement | null)?.blur()
    onSelect(selectedTopicId)
  }

  const searchField = (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        enterKeyHint="search"
        placeholder={t("game.themePicker.searchPlaceholder")}
        className="pl-9"
      />
    </div>
  )

  return (
    <AppDialog
      open={open}
      onClose={close}
      title={title ?? t("game.themePicker.title")}
      sub={sub ?? t("game.themePicker.subtitle")}
      className="sm:max-w-lg"
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      bodyClassName="flex flex-col"
      toolbar={compact ? undefined : searchField}
      bottomBar={compact ? searchField : undefined}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={pending}>
            {t("game.themePicker.cancel")}
          </Button>
          <Button onClick={launch} disabled={pending || !selectedTopicId}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending
              ? t("game.playMode.launching")
              : t("game.themePicker.launch")}
          </Button>
        </>
      }
    >
      {topicsQuery.isLoading ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t("common.app.loading")}
        </p>
      ) : topics.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {t("game.themePicker.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {topics.map((topic) => (
            <ThemeSelectRow
              key={topic.topicId}
              topic={topic}
              selected={selectedTopicId === topic.topicId}
              onSelect={() => setSelectedTopicId(topic.topicId)}
            />
          ))}
          {topicsQuery.hasNextPage && (
            <div
              ref={sentinelRef}
              className="py-3 text-center text-xs text-muted-foreground"
            >
              {topicsQuery.isFetchingNextPage
                ? t("common.app.loading")
                : "\u00a0"}
            </div>
          )}
        </div>
      )}
    </AppDialog>
  )
}
