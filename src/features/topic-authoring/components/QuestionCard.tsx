import { useTranslation } from "react-i18next"
import {
  CheckCircle2,
  Flag,
  ImageIcon,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeading,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
import type { TranslationKey } from "@/lib/i18n/types"
import type { QuestionEditor, QuestionStatus } from "../domain/topic-authoring"

const STATUS_LABEL_KEYS: Record<QuestionStatus, TranslationKey> = {
  PENDING: "authoring.status.pending",
  APPROVED: "authoring.status.approved",
  REJECTED: "authoring.status.rejected",
}

const STATUS_CLASSES: Record<QuestionStatus, string> = {
  PENDING: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  APPROVED: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  REJECTED: "border-destructive/40 bg-destructive/10 text-destructive",
}

interface QuestionCardProps {
  question: QuestionEditor
  busy: boolean
  onEdit: () => void
  onApprove: () => void
  onReject: () => void
  onReports: () => void
}

/** Ligne de question dans l'atelier d'un sujet : contenu FR, statut et actions de modération. */
export function QuestionCard({
  question,
  busy,
  onEdit,
  onApprove,
  onReject,
  onReports,
}: QuestionCardProps) {
  const { t } = useTranslation()
  const french = question.contents.find((content) => content.language === "fr")
  const languages = question.contents.map((content) =>
    content.language.toUpperCase()
  )
  const correctAnswer = question.contents
    .find((content) => content.language === "fr")
    ?.answers.find((answer) => answer.choice === question.correctAnswer)?.text

  return (
    <Card>
      <CardHeader>
        <CardMedia>
          {question.imageUrl ? (
            <img
              src={question.imageUrl}
              alt=""
              className="size-9 rounded-lg object-cover"
            />
          ) : (
            <span className="grid size-9 place-items-center rounded-lg bg-muted">
              <ImageIcon className="size-4 text-muted-foreground" />
            </span>
          )}
        </CardMedia>
        <CardHeading>
          <CardTitle className="truncate">
            {french?.text ?? question.contents[0]?.text}
          </CardTitle>
          <CardDescription className="truncate">
            {correctAnswer
              ? t("authoring.question.correctAnswerText", {
                  choice: question.correctAnswer,
                  text: correctAnswer,
                })
              : t("authoring.question.correctAnswer", {
                  choice: question.correctAnswer,
                })}
          </CardDescription>
        </CardHeading>
        <CardAction>
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {question.suspended && (
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-600"
              >
                {t("authoring.status.suspended")}
              </Badge>
            )}
            {question.archived && (
              <Badge variant="secondary">{t("authoring.status.archived")}</Badge>
            )}
            <Badge variant="outline" className={STATUS_CLASSES[question.status]}>
              {question.status === "APPROVED" && <CheckCircle2 />}
              {question.status === "REJECTED" && <XCircle />}
              {t(STATUS_LABEL_KEYS[question.status])}
            </Badge>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center justify-between gap-2 pt-0">
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary">{languages.join(" · ")}</Badge>
          {question.difficulty && (
            <Badge variant="secondary">{question.difficulty}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {question.totalReportCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/15"
              onClick={onReports}
              disabled={busy}
            >
              <Flag />
              {t("authoring.reports.actionCount", {
                count:
                  question.openReportCount > 0
                    ? question.openReportCount
                    : question.totalReportCount,
              })}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
            <Pencil /> {t("authoring.question.edit")}
          </Button>
          {question.status !== "APPROVED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onApprove}
              disabled={busy}
            >
              <ThumbsUp /> {t("authoring.question.approve")}
            </Button>
          )}
          {question.status !== "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={busy}
            >
              <ThumbsDown /> {t("authoring.question.reject")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
