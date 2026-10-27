import { useTranslation } from "react-i18next"
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect"
import type { Suggestion } from "@/features/shell/domain/suggestion"
import type { PlayerSource } from "../../domain/opponents"
import { PlayerSelectRow } from "../PlayerSelectRow"
import { PLAYER_SOURCE_KEYS } from "./options"

interface PlayerPickerStepProps {
  playerSource: PlayerSource
  playerQuery: string
  playerResults: Suggestion[]
  playersLoading: boolean
  selectedPlayerId: string
  onSelect: (playerId: string) => void
  playersHasMore?: boolean
  playersLoadingMore?: boolean
  onLoadMorePlayers?: () => void
  /** Joueurs déjà en défi PENDING sur le sujet : ligne informative, non sélectionnable. */
  blockedPlayerIds?: ReadonlySet<string>
}

/** Étape 3 : sélection du joueur cible (résultats de la source choisie, scroll infini). */
export function PlayerPickerStep({
  playerSource,
  playerQuery,
  playerResults,
  playersLoading,
  selectedPlayerId,
  onSelect,
  playersHasMore = false,
  playersLoadingMore = false,
  onLoadMorePlayers,
  blockedPlayerIds = new Set<string>(),
}: PlayerPickerStepProps) {
  const { t } = useTranslation()
  const loadMoreRef = useLoadMoreOnIntersect({
    enabled: playersHasMore && !playersLoadingMore,
    onLoadMore: () => onLoadMorePlayers?.(),
  })

  const universalQueryMissing =
    playerSource === "all" && playerQuery.trim().length < 2

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {universalQueryMissing ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("game.playMode.universalMinChars")}
        </p>
      ) : playersLoading ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t("game.playMode.searching")}
        </p>
      ) : playerResults.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {t(PLAYER_SOURCE_KEYS[playerSource].empty)}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain">
          {playerResults.map((player) => {
            const blocked = blockedPlayerIds.has(player.id)
            return (
              <PlayerSelectRow
                key={player.id}
                player={
                  blocked
                    ? {
                        ...player,
                        subtitle: t("game.playMode.opponentAlreadyChallenged"),
                      }
                    : player
                }
                selected={!blocked && selectedPlayerId === player.id}
                onSelect={
                  blocked
                    ? undefined
                    : () => {
                        // Replie le clavier mobile après sélection (footer accessible).
                        ;(document.activeElement as HTMLElement | null)?.blur()
                        onSelect(player.id)
                      }
                }
              />
            )
          })}
          {playersHasMore && (
            <div
              ref={loadMoreRef}
              className="py-3 text-center text-xs text-muted-foreground"
            >
              {playersLoadingMore ? t("common.app.loading") : "\u00a0"}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
