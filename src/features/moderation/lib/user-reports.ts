import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { ReportUserInput, UserReportAck } from "../domain/user-report"

export const userReportsService = {
  report: (userId: string, input: ReportUserInput): Promise<UserReportAck> =>
    api.post<UserReportAck>(ENDPOINTS.profiles.reports(userId), input),
}
