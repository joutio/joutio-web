import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserAvatar } from "@/shared/components/user-avatar"
import { AppDialog } from "@/shared/components/app-dialog"
import { SelectableTile } from "@/shared/components/selectable-tile"
import type { TranslationKey } from "@/lib/i18n/types"
import type { UserReportReason } from "../domain/user-report"
import { useReportUser } from "../hooks/useReportUser"

const MAX_COMMENT = 500

const REASONS: {
  value: UserReportReason
  label: TranslationKey
  hint: TranslationKey
}[] = [
  {
    value: "HARASSMENT",
    label: "moderation.report.reasonHarassment",
    hint: "moderation.report.reasonHarassmentHint",
  },
  {
    value: "HATE_SPEECH",
    label: "moderation.report.reasonHate",
    hint: "moderation.report.reasonHateHint",
  },
  {
    value: "INAPPROPRIATE_CONTENT",
    label: "moderation.report.reasonContent",
    hint: "moderation.report.reasonContentHint",
  },
  {
    value: "CHEATING",
    label: "moderation.report.reasonCheating",
    hint: "moderation.report.reasonCheatingHint",
  },
  {
    value: "SPAM",
    label: "moderation.report.reasonSpam",
    hint: "moderation.report.reasonSpamHint",
  },
  {
    value: "OTHER",
    label: "moderation.report.reasonOther",
    hint: "moderation.report.reasonOtherHint",
  },
]

interface ReportUserDialogProps {
  open: boolean
  onClose: () => void
  targetUserId: string
  targetPseudonym: string
  targetAvatarOptions?: string | null
  gameId?: string
  onReported?: () => void
}

/**
 * Signalement d'un joueur : motifs multiples + commentaire optionnel.
 * L'identité du signalant n'est jamais révélée au joueur signalé.
 */
export function ReportUserDialog({
  open,
  onClose,
  targetUserId,
  targetPseudonym,
  targetAvatarOptions,
  gameId,
  onReported,
}: ReportUserDialogProps) {
  const { t } = useTranslation()
  const [reasons, setReasons] = useState<Set<UserReportReason>>(new Set())
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const report = useReportUser()

  const toggleReason = (reason: UserReportReason, pressed: boolean) => {
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
      setError(t("moderation.report.reasonRequired"))
      return
    }
    report.mutate(
      {
        userId: targetUserId,
        input: {
          reasons: [...reasons],
          comment: comment.trim() || undefined,
          gameId,
        },
      },
      {
        onSuccess: () => {
          setReasons(new Set())
          setComment("")
          setError(null)
          onReported?.()
          onClose()
        },
      }
    )
  }

  const close = () => {
    if (report.isPending) return
    setReasons(new Set())
    setComment("")
    setError(null)
    onClose()
  }

  return (
    <AppDialog
      open={open}
      onClose={close}
      title={t("moderation.report.title")}
      sub={t("moderation.report.description")}
      sheetOnTouch
      sheetDetents={[0.92]}
      sheetLayer={60}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={report.isPending}>
            {t("moderation.report.cancel")}
          </Button>
          <Button onClick={submit} disabled={report.isPending}>
            <Flag />
            {report.isPending
              ? t("moderation.report.submitting")
              : t("moderation.report.submit")}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
          <UserAvatar
            name={targetPseudonym}
            userId={targetUserId}
            avatarOptions={targetAvatarOptions ?? undefined}
            size={44}
          />
          <div className="min-w-0">
            <p className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t("moderation.report.previewLabel")}
            </p>
            <p className="truncate text-sm font-medium">{targetPseudonym}</p>
            {gameId ? (
              <p className="text-xs text-muted-foreground">
                {t("moderation.report.gameContext")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t("moderation.report.reasonsLabel")}</Label>
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
            <Label htmlFor="user-report-comment">
              {t("moderation.report.commentLabel")}
            </Label>
            <span className="text-2xs text-muted-foreground">
              {t("moderation.report.commentCounter", {
                count: comment.length,
              })}
            </span>
          </div>
          <Textarea
            id="user-report-comment"
            value={comment}
            maxLength={MAX_COMMENT}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("moderation.report.commentPlaceholder")}
            rows={3}
          />
        </div>
      </div>
    </AppDialog>
  )
}
