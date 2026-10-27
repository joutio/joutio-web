import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Flag } from "lucide-react"
import { showToast } from "@/shared/utils/toast"
import { gamesService } from "../lib/games"
import type {
  QuestionReportAck,
  ReportQuestionInput,
} from "../domain/question-report"

/** Envoi d'un signalement de question depuis la revue de fin de duel. */
export function useReportQuestion() {
  const { t } = useTranslation()
  return useMutation<
    QuestionReportAck,
    Error,
    { questionId: string; input: ReportQuestionInput }
  >({
    mutationFn: ({ questionId, input }) =>
      gamesService.reportQuestion(questionId, input),
    onSuccess: (ack) => {
      showToast({
        title: ack.created
          ? t("game.report.success")
          : t("game.report.already"),
        icon: Flag,
        tone: "success",
      })
    },
    onError: () => {
      showToast({
        title: t("game.report.error"),
        icon: Flag,
        tone: "danger",
      })
    },
  })
}
