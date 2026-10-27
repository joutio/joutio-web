import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { EventEnvelopeResponse } from "@/shared/types/notifications"
import type { GameNotification } from "../domain/game-notification"
import type {
  ActiveGameView,
  GameChoice,
  GameResultView,
} from "../domain/game-dto"
import type {
  QuestionReportAck,
  ReportQuestionInput,
} from "../domain/question-report"

/** Arène : réponse, annulation, historique de notifications. La création passe par la salle. */
export const gamesService = {
  /**
   * Parties en cours du joueur (reprise) — liste vide si aucune (jamais de 404).
   * Sonde de fond : pas de toast global en cas d'échec réseau/transitoire.
   */
  active: (): Promise<ActiveGameView[]> =>
    api.get<ActiveGameView[]>(ENDPOINTS.games.active, { skipErrorBus: true }),

  /**
   * Réponse à la question courante. Timeout court et pas de toast global : sur connexion
   * faible, l'arène garde la sélection et retente en arrière-plan (feedback transparent).
   */
  answer: (gameId: string, choice: GameChoice): Promise<void> =>
    api.post<void>(
      ENDPOINTS.games.answer(gameId),
      { choice },
      { skipErrorBus: true, timeoutMs: 4_000 }
    ),

  cancel: (gameId: string): Promise<void> =>
    api.post<void>(ENDPOINTS.games.cancel(gameId)),

  /** Bilan autoritaire d'un duel terminé (récompense + progression). */
  result: (gameId: string): Promise<GameResultView> =>
    api.get<GameResultView>(ENDPOINTS.games.result(gameId)),

  /** Historique des notifications (même contrat que le push WebSocket). */
  getNotifications: (
    gameId: string
  ): Promise<EventEnvelopeResponse<GameNotification>[]> =>
    api.get<EventEnvelopeResponse<GameNotification>[]>(
      ENDPOINTS.games.notifications(gameId)
    ),

  /** Signale la question jouée dans une partie terminée (idempotent côté serveur). */
  reportQuestion: (
    questionId: string,
    input: ReportQuestionInput
  ): Promise<QuestionReportAck> =>
    api.post<QuestionReportAck>(ENDPOINTS.questions.reports(questionId), input),
}
