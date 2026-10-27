import { useMutation } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Flag } from "lucide-react"

import { showToast } from "@/shared/utils/toast"
import type {
  ReportUserInput,
  UserReportAck,
} from "../domain/user-report"
import { userReportsService } from "../lib/user-reports"

export function useReportUser() {
  const { t } = useTranslation()
  return useMutation<
    UserReportAck,
    Error,
    { userId: string; input: ReportUserInput }
  >({
    mutationFn: ({ userId, input }) => userReportsService.report(userId, input),
    onSuccess: (ack) => {
      showToast({
        title: ack.created
          ? t("moderation.report.success")
          : t("moderation.report.already"),
        icon: Flag,
        tone: ack.created ? "success" : "info",
      })
    },
    onError: () => {
      showToast({
        title: t("moderation.report.error"),
        icon: Flag,
        tone: "danger",
      })
    },
  })
}
