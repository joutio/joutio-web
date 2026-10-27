import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Check, Pencil, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AppDialog } from "@/shared/components/app-dialog"
import type { TranslationKey } from "@/lib/i18n/types"
import type {
  OwnerQuestionReport,
  QuestionEditor,
  QuestionReportReason,
  QuestionReportResolution,
  QuestionReportSnapshot,
} from "../domain/topic-authoring"
import {
  useQuestionReports,
  useResolveQuestionReports,
} from "../hooks/useTopicAuthoring"

const REASON_KEYS: Record<QuestionReportReason, TranslationKey> = {
  QUESTION: "authoring.reports.reasonQuestion",
  IMAGE: "authoring.reports.reasonImage",
  ANSWERS: "authoring.reports.reasonAnswers",
}

interface QuestionReportsDialogProps {
  topicId: string
  question: QuestionEditor
  onClose: () => void
  onEdit: () => void
}

/**
 * Signalements d'une question, côté propriétaire du sujet : snapshot de la version signalée,
 * motifs, commentaire, puis clôture unitaire ou globale. L'identité du signalant n'est jamais
 * exposée par le BFF.
 */
export function QuestionReportsDialog({
  topicId,
  question,
  onClose,
  onEdit,
}: QuestionReportsDialogProps) {
  const { t } = useTranslation()
  const reports = useQuestionReports(question.questionId)
  const resolve = useResolveQuestionReports(topicId)
  const [note, setNote] = useState("")

  const openReports = (reports.data ?? []).filter(
    (report) => report.status === "OPEN"
  )

  const closeReport = (
    report: OwnerQuestionReport,
    resolution: QuestionReportResolution
  ) => {
    resolve.mutate({
      questionId: question.questionId,
      reportId: report.reportId,
      input: { resolution, note: note.trim() || undefined },
    })
  }

  const closeAll = (resolution: QuestionReportResolution) => {
    resolve.mutate({
      questionId: question.questionId,
      input: { resolution, note: note.trim() || undefined },
    })
  }

  return (
    <AppDialog
      open
      onClose={onClose}
      title={t("authoring.reports.title")}
      sub={question.contents[0]?.text}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("authoring.reports.close")}
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil /> {t("authoring.reports.edit")}
          </Button>
          <Button
            onClick={() => closeAll("RESOLVED")}
            disabled={openReports.length === 0 || resolve.isPending}
          >
            <Check /> {t("authoring.reports.resolveAll")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {question.suspended && (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            {t("authoring.reports.suspended")}
          </p>
        )}
        {question.archived && (
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {t("authoring.reports.archived")}
          </p>
        )}

        {reports.isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/50" />
        ) : (reports.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("authoring.reports.empty")}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.data?.map((report) => (
              <ReportCard
                key={report.reportId}
                report={report}
                busy={resolve.isPending}
                onResolve={() => closeReport(report, "RESOLVED")}
                onDismiss={() => closeReport(report, "DISMISSED")}
              />
            ))}
          </div>
        )}

        {openReports.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="report-resolution-note">
              {t("authoring.reports.noteLabel")}
            </Label>
            <Textarea
              id="report-resolution-note"
              value={note}
              maxLength={500}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("authoring.reports.notePlaceholder")}
              rows={2}
            />
          </div>
        )}
      </div>
    </AppDialog>
  )
}

function ReportCard({
  report,
  busy,
  onResolve,
  onDismiss,
}: {
  report: OwnerQuestionReport
  busy: boolean
  onResolve: () => void
  onDismiss: () => void
}) {
  const { t } = useTranslation()
  const opened = report.status === "OPEN"

  return (
    <article className="rounded-xl border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {report.reasons.map((reason) => (
          <Badge key={reason} variant="secondary">
            {t(REASON_KEYS[reason])}
          </Badge>
        ))}
        <Badge
          variant="outline"
          className={
            opened
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
              : report.status === "RESOLVED"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
                : undefined
          }
        >
          {opened
            ? t("authoring.reports.open")
            : report.status === "RESOLVED"
              ? t("authoring.reports.resolved")
              : t("authoring.reports.dismissed")}
        </Badge>
        <span className="ml-auto text-2xs text-muted-foreground">
          {new Date(report.createdAt).toLocaleString()}
        </span>
      </div>

      {report.snapshot && <SnapshotView snapshot={report.snapshot} />}

      {report.comment ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">
            {t("authoring.reports.comment")} ·{" "}
          </span>
          {report.comment}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("authoring.reports.noComment")}
        </p>
      )}

      {opened && (
        <div className="mt-3 flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={onDismiss} disabled={busy}>
            <X /> {t("authoring.reports.dismiss")}
          </Button>
          <Button size="sm" variant="outline" onClick={onResolve} disabled={busy}>
            <Check /> {t("authoring.reports.resolve")}
          </Button>
        </div>
      )}
    </article>
  )
}

function SnapshotView({ snapshot }: { snapshot: QuestionReportSnapshot }) {
  const { t } = useTranslation()
  const translated = snapshot.translations.find(
    (content) => content.language === snapshot.language
  )
  const answers = translated?.answers ?? snapshot.answers
  const text = translated?.text ?? snapshot.questionText

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-2.5">
      <p className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
        {snapshot.source === "PLAYED"
          ? t("authoring.reports.reportedVersion")
          : t("authoring.reports.currentVersion")}
      </p>
      <p className="mt-1 text-sm font-medium">{text}</p>
      {snapshot.imageUrl && (
        <img
          src={snapshot.imageUrl}
          alt=""
          className="mt-2 max-h-28 w-full rounded-md object-contain"
        />
      )}
      <ul className="mt-2 grid grid-cols-2 gap-1">
        {answers.map((answer) => (
          <li
            key={answer.choice}
            className={
              answer.choice === snapshot.correctAnswer
                ? "rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-700"
                : "rounded-md px-2 py-1 text-xs text-muted-foreground"
            }
          >
            {answer.choice}. {answer.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
