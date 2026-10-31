import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FlagIcon } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AppDialog } from "@/shared/components/app-dialog"
import { SelectableTile } from "@/shared/components/selectable-tile"
import type { TranslationKey } from "@/lib/i18n/types"
import type { QuestionReportReason } from "../../domain/question-report"
import { useReportQuestion } from "../../hooks/useReportQuestion"

const MAX_COMMENT = 500

const REASONS: {
  value: QuestionReportReason
  label: TranslationKey
  hint: TranslationKey
}[] = [
  {
    value: "QUESTION",
    label: "game.report.reasonQuestion",
    hint: "game.report.reasonQuestionHint",
  },
  {
    value: "IMAGE",
    label: "game.report.reasonImage",
    hint: "game.report.reasonImageHint",
  },
  {
    value: "ANSWERS",
    label: "game.report.reasonAnswers",
    hint: "game.report.reasonAnswersHint",
  },
]

interface ReportQuestionDialogProps {
  open: boolean
  onClose: () => void
  gameId: string
  questionId: string
  questionText: string
  imageUrl?: string | null
  language?: string
  onReported: () => void
}

/** Formulaire de signalement d'une question : motifs multiples + commentaire optionnel. */
export function ReportQuestionDialog({
  open,
  onClose,
  gameId,
  questionId,
  questionText,
  imageUrl,
  language,
  onReported,
}: ReportQuestionDialogProps) {
  const { t } = useTranslation()
  const [reasons, setReasons] = useState<Set<QuestionReportReason>>(new Set())
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const report = useReportQuestion()

  const toggleReason = (reason: QuestionReportReason, pressed: boolean) => {
    setError(null)
    setReasons((current) => {
      const next = new Set(current)
      if (pressed) next.add(reason)
      else next.delete(reason)
      return next
    })
  }

  const submit = () => {
    if (reasons.size === 0) {
      setError(t("game.report.reasonRequired"))
      return
    }
    report.mutate(
      {
        questionId,
        input: {
          gameId,
          reasons: [...reasons],
          comment: comment.trim() || undefined,
          language,
        },
      },
      {
        onSuccess: () => {
          setReasons(new Set())
          setComment("")
          setError(null)
          onReported()
          onClose()
        },
      }
    )
  }

  const close = () => {
    if (report.isPending) return
    setError(null)
    onClose()
  }

  return (
    <AppDialog
      open={open}
      onClose={close}
      title={t("game.report.title")}
      sub={t("game.report.description")}
      sheetOnTouch
      sheetDetents={[0.92]}
      sheetLayer={60}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={report.isPending}>
            {t("game.report.cancel")}
          </Button>
          <Button onClick={submit} disabled={report.isPending}>
            <FlagIcon />
            {report.isPending
              ? t("game.report.submitting")
              : t("game.report.submit")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("game.report.previewLabel")}
          </p>
          <p className="mt-1 text-sm font-medium">{questionText}</p>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="mt-2 max-h-32 w-full rounded-lg object-contain"
            />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("game.report.reasonsLabel")}</Label>
          <div className="flex flex-col gap-2">
            {REASONS.map((reason) => (
              <SelectableTile
                key={reason.value}
                title={t(reason.label)}
                hint={t(reason.hint)}
                selected={reasons.has(reason.value)}
                onSelectedChange={(selected) =>
                  toggleReason(reason.value, selected)
                }
              />
            ))}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="question-report-comment">
              {t("game.report.commentLabel")}
            </Label>
            <span className="text-2xs text-muted-foreground">
              {t("game.report.commentCounter", { count: comment.length })}
            </span>
          </div>
          <Textarea
            id="question-report-comment"
            value={comment}
            maxLength={MAX_COMMENT}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("game.report.commentPlaceholder")}
            rows={3}
          />
        </div>
      </div>
    </AppDialog>
  )
}
