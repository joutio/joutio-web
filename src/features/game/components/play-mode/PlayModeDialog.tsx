import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AppDialog } from "@/shared/components/app-dialog"
import { useDevice } from "@/shared/hooks/use-device"
import { SHEET_DETENTS } from "@/shared/theme/sheets"
import type { Suggestion } from "@/features/shell/domain/suggestion"
import type { BotDifficulty } from "../../domain/game-dto"
import type { PlayerSource } from "../../domain/opponents"
import { DifficultyStep } from "./DifficultyStep"
import { OpponentStep } from "./OpponentStep"
import { PLAYER_SOURCE_KEYS, type Opponent } from "./options"
import { PlayerPickerStep } from "./PlayerPickerStep"
import { PlayerSourceStep } from "./PlayerSourceStep"

interface PlayModeDialogProps {
  open: boolean
  onClose: () => void
  onStartWorld: () => void
  onStartBot: (difficulty: BotDifficulty) => void
  onStartPlayer: (opponentId: string) => void
  onStartPrivate: () => void
  /** Recherche du joueur cible (état porté par la page : évite un import croisé duel → shell). */
  playerQuery: string
  onPlayerQueryChange: (query: string) => void
  playerSource: PlayerSource
  onPlayerSourceChange: (source: PlayerSource) => void
  playerResults: Suggestion[]
  playersLoading: boolean
  /** Scroll infini de la liste de joueurs (abonnements / abonnés). */
  playersHasMore?: boolean
  playersLoadingMore?: boolean
  onLoadMorePlayers?: () => void
  /** Un salon privé/partagé du joueur est déjà ouvert sur ce sujet : seul le privé est bloqué. */
  roomAlreadyOpenOnTopic?: boolean
  /** Joueurs déjà en défi PENDING sur ce sujet (unicité symétrique). */
  blockedOpponentIds?: ReadonlySet<string>
  pending?: boolean
}

/**
 * Popup unique « Lancer un duel » à étapes : qui défier (monde / joueur / bot / salon privé),
 * puis difficulté (bot) ou source (abonnements / abonnés / recherche universelle) puis sélection
 * du joueur cible (cf. `play-mode/` pour les étapes). Le sujet n'est rappelé qu'à la première
 * étape.
 */
export function PlayModeDialog({
  open,
  onClose,
  onStartWorld,
  onStartBot,
  onStartPlayer,
  onStartPrivate,
  playerQuery,
  onPlayerQueryChange,
  playerSource,
  onPlayerSourceChange,
  playerResults,
  playersLoading,
  playersHasMore = false,
  playersLoadingMore = false,
  onLoadMorePlayers,
  roomAlreadyOpenOnTopic = false,
  blockedOpponentIds = new Set<string>(),
  pending,
}: PlayModeDialogProps) {
  const { t } = useTranslation()
  const compact = useDevice() === "compact"
  const [step, setStep] = useState(0)
  const [opponent, setOpponent] = useState<Opponent>("world")
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL")
  const [selectedPlayerId, setSelectedPlayerId] = useState("")

  const playerStep = step === 2 && opponent === "player"
  const totalSteps = opponent === "player" ? 3 : opponent === "bot" ? 2 : 1
  const isFinalStep = step === totalSteps - 1
  const pendingAction = pending ?? false
  // Le bot reste disponible : un salon privé ouvert ne doit pas empêcher l'entraînement.
  const blockedRoomChoices = roomAlreadyOpenOnTopic
    ? new Set<Opponent>(["private"])
    : new Set<Opponent>()
  const selectedPlayerBlocked =
    selectedPlayerId !== "" && blockedOpponentIds.has(selectedPlayerId)
  const playerStepIncomplete =
    isFinalStep &&
    opponent === "player" &&
    (!selectedPlayerId || selectedPlayerBlocked)
  const roomChoiceBlocked = roomAlreadyOpenOnTopic && opponent === "private"

  function launch() {
    if (opponent === "world") onStartWorld()
    else if (opponent === "bot") onStartBot(difficulty)
    else if (
      opponent === "player" &&
      selectedPlayerId &&
      !selectedPlayerBlocked
    )
      onStartPlayer(selectedPlayerId)
    else if (opponent === "private" && !roomAlreadyOpenOnTopic) onStartPrivate()
  }

  function next() {
    if (!isFinalStep) {
      setStep(step + 1)
      return
    }
    launch()
  }

  function goBack() {
    if (opponent === "player" && step === 2) setSelectedPlayerId("")
    setStep(step - 1)
  }

  const playerSearchField = (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={playerSource === "all"}
        value={playerQuery}
        onChange={(event) => onPlayerQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        enterKeyHint="search"
        placeholder={t(PLAYER_SOURCE_KEYS[playerSource].placeholder)}
        className="pl-9"
      />
    </div>
  )

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={t("game.playMode.title")}
      sub={t("game.playMode.subtitle")}
      className="sm:max-w-md"
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      bodyClassName="flex flex-col"
      toolbar={
        <div className="flex flex-col gap-3">
          {/* L'indicateur d'étape précède toujours la recherche. */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("game.playMode.step", {
                current: step + 1,
                total: totalSteps,
              })}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {playerStep && (
            <div>
              <div className="mb-3 font-heading text-sm font-bold">
                {t("game.playMode.choosePlayer")}
              </div>
              {/* En compact, la recherche reste en bas, juste au-dessus des actions (bottomBar). */}
              {!compact && playerSearchField}
            </div>
          )}
        </div>
      }
      bottomBar={compact && playerStep ? playerSearchField : undefined}
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={goBack}>
              <ChevronLeft size={15} /> {t("game.playMode.previous")}
            </Button>
          )}
          <div className="flex-1 touch:hidden" />
          <Button variant="outline" onClick={onClose} disabled={pendingAction}>
            {t("game.playMode.cancel")}
          </Button>
          <Button
            onClick={next}
            disabled={
              pendingAction || playerStepIncomplete || roomChoiceBlocked
            }
          >
            {pendingAction && <Loader2 className="size-4 animate-spin" />}
            {isFinalStep
              ? pendingAction
                ? t("game.playMode.launching")
                : t("game.playMode.launch")
              : t("game.playMode.next")}
          </Button>
        </>
      }
    >
      {step === 0 && (
        <div className="flex flex-col gap-3">
          {roomAlreadyOpenOnTopic && (
            <p className="rounded-lg border border-border bg-surface-muted p-3 text-xs text-muted-foreground">
              {t("game.playMode.roomAlreadyOpen")}
            </p>
          )}
          <OpponentStep
            selected={opponent}
            onSelect={setOpponent}
            disabled={blockedRoomChoices}
          />
        </div>
      )}

      {step === 1 && opponent === "bot" && (
        <DifficultyStep selected={difficulty} onSelect={setDifficulty} />
      )}

      {step === 1 && opponent === "player" && (
        <PlayerSourceStep
          selected={playerSource}
          onSelect={(source) => {
            setSelectedPlayerId("")
            onPlayerSourceChange(source)
          }}
        />
      )}

      {playerStep && (
        <PlayerPickerStep
          playerSource={playerSource}
          playerQuery={playerQuery}
          playerResults={playerResults}
          playersLoading={playersLoading}
          selectedPlayerId={selectedPlayerId}
          onSelect={setSelectedPlayerId}
          playersHasMore={playersHasMore}
          playersLoadingMore={playersLoadingMore}
          onLoadMorePlayers={onLoadMorePlayers}
          blockedPlayerIds={blockedOpponentIds}
        />
      )}
    </AppDialog>
  )
}
