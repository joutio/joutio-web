import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { DialogClose } from "@/components/ui/dialog"
import { CloseButton } from "@/shared/components/close-button"
import { TopicIcon } from "@/shared/components/topic-icon"
import { SuspendedBadge } from "@/shared/components/suspended-badge"
import { UserAvatar } from "@/shared/components/user-avatar"
import { useDebounce } from "@/shared/hooks/useDebounce"
import { useDevice } from "@/shared/hooks/use-device"
import { usePreloadImages } from "@/shared/hooks/usePreloadImages"
import { useSuggestions } from "../hooks/useSuggestions"
import { categoryColor } from "@/shared/utils/categories"
import { useTopicName } from "../hooks/useTopicName"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Recherche globale (⌘K) — Sujets + Utilisateurs, composée par `GET /api/suggestions`. */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const compact = useDevice() === "compact"
  const [query, setQuery] = useState("")
  const debounced = useDebounce(query, 250)

  const isQuery = debounced.trim().length >= 2
  const suggestionsQuery = useSuggestions(debounced, open)
  const suggestions = suggestionsQuery.data ?? []
  const topics = suggestions.filter((suggestion) => suggestion.type === "TOPIC")
  const players = suggestions.filter(
    (suggestion) => suggestion.type === "PLAYER"
  )

  // Visuels des suggestions de sujets préchargés (navigation instantanée depuis ⌘K).
  const suggestionImageUrls = useMemo(
    () =>
      (suggestionsQuery.data ?? [])
        .filter((suggestion) => suggestion.type === "TOPIC")
        .map((suggestion) => suggestion.imageUrl),
    [suggestionsQuery.data]
  )
  usePreloadImages(suggestionImageUrls, { limit: 5, priority: "low" })

  // À l'ouverture, force le focus (et la sélection) sur le champ : l'utilisateur tape
  // directement. Nécessaire en compact où le premier élément focusable est le bouton fermer.
  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(
        '[data-slot="command-input"]'
      )
      input?.focus()
      input?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  function close() {
    setQuery("")
    onOpenChange(false)
  }

  function goTopic(topicId: string) {
    close()
    void navigate(`/topics/${topicId}`)
  }

  function goPlayer(userId: string) {
    close()
    void navigate(`/players/${userId}`)
  }

  const searchInput = (
    <CommandInput
      value={query}
      onValueChange={setQuery}
      enterKeyHint="search"
      onKeyDown={(event) => {
        // Sans suggestion à sélectionner, Entrée replie le clavier (cmdk garde la main sinon).
        if (event.key === "Enter" && suggestions.length === 0) {
          event.currentTarget.blur()
        }
      }}
      placeholder={t("shell.search.placeholder")}
    />
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t("shell.search.title")}
      description={t("shell.search.description")}
      showCloseButton={false}
    >
      <Command shouldFilter={false}>
        {/* Compact : bandeau dédié qui porte la sortie de la recherche plein écran. */}
        <div className="hidden items-center justify-between gap-2 border-b px-(--page-gutter-x) py-2 compact:flex">
          <span className="px-1.5 font-heading text-sm font-bold">
            {t("shell.search.heading")}
          </span>
          <DialogClose
            render={<CloseButton aria-label={t("shell.search.closeAria")} />}
          />
        </div>
        {/* En compact, la saisie est épinglée en bas (au-dessus du clavier) ; sinon en tête. */}
        {!compact && searchInput}
        <CommandList>
          <CommandEmpty>
            {isQuery
              ? t("shell.search.emptyNoResult")
              : t("shell.search.emptyQuery")}
          </CommandEmpty>

          {isQuery && topics.length > 0 && (
            <CommandGroup heading={t("shell.search.topicsGroup")}>
              {topics.map((topic) => (
                <CommandItem
                  key={topic.id}
                  value={`topic-${topic.id}`}
                  onSelect={() => goTopic(topic.id)}
                >
                  <TopicIcon topic={topic} size={24} />
                  <span className="truncate">
                    {resolveName(
                      topic.names,
                      topic.label ?? t("shell.search.topicFallback")
                    )}
                  </span>
                  {/* Catégorie du sujet : nom porté par sa couleur éditoriale. */}
                  <span
                    className="ml-auto text-xs text-muted-foreground"
                    style={
                      topic.category
                        ? { color: categoryColor(topic.category) }
                        : undefined
                    }
                  >
                    {topic.subtitle ?? t("shell.search.topicFallback")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {isQuery && players.length > 0 && (
            <CommandGroup heading={t("shell.search.playersGroup")}>
              {players.map((player) => (
                <CommandItem
                  key={player.id}
                  value={`player-${player.id}`}
                  onSelect={() => goPlayer(player.id)}
                >
                  <UserAvatar
                    name={player.label ?? t("shell.search.playerFallback")}
                    userId={player.id}
                    avatarOptions={player.avatarOptions ?? undefined}
                    size={24}
                  />
                  <span className="truncate">
                    {player.label ?? t("shell.search.playerFallback")}
                  </span>
                  {player.suspended ? (
                    <SuspendedBadge className="ml-1" />
                  ) : null}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {player.subtitle ?? t("shell.search.userFallback")}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
        {compact && (
          <div className="border-t bg-popover px-2 pt-1.5 pb-1.5">
            {searchInput}
          </div>
        )}
      </Command>
    </CommandDialog>
  )
}
