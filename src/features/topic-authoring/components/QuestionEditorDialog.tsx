import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { Language } from "@/features/player/domain/profile"
import { AppDialog } from "@/shared/components/app-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MediaUpload } from "@/shared/components/media-upload"
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch"
import type { QuestionEditor } from "../domain/topic-authoring"
import {
  MAX_QUESTION_TEXT,
  QUESTION_CHOICES,
  draftErrors,
  draftFromQuestion,
  emptyDraft,
  type ContentDraft,
  type DraftError,
  type QuestionDraft,
} from "../lib/question-draft"
import { useSaveQuestion } from "../hooks/useTopicAuthoring"

interface QuestionEditorDialogProps {
  topicId: string
  /** Question éditée, ou `null` pour une création. */
  question: QuestionEditor | null
  onClose: () => void
}

export function QuestionEditorDialog({
  topicId,
  question,
  onClose,
}: QuestionEditorDialogProps) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    question ? draftFromQuestion(question) : emptyDraft()
  )
  const [language, setLanguage] = useState<Language>("fr")
  const [errors, setErrors] = useState<DraftError[]>([])
  const save = useSaveQuestion(topicId)

  const updateContent = (target: Language, patch: Partial<ContentDraft>) => {
    setDraft((current) => ({
      ...current,
      [target]: { ...current[target], ...patch },
    }))
  }

  const updateAnswer = (
    target: Language,
    choice: (typeof QUESTION_CHOICES)[number],
    text: string
  ) => {
    setDraft((current) => ({
      ...current,
      [target]: {
        ...current[target],
        answers: { ...current[target].answers, [choice]: text },
      },
    }))
  }

  const submit = () => {
    const validationErrors = draftErrors(draft)
    setErrors(validationErrors)
    if (validationErrors.length > 0) {
      return
    }
    save.mutate({ question, draft }, { onSuccess: onClose })
  }

  const content = draft[language]

  return (
    <AppDialog
      open
      onClose={onClose}
      title={
        question
          ? t("authoring.editor.editTitle")
          : t("authoring.editor.createTitle")
      }
      sub={t("authoring.editor.sub")}
      toolbar={
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={language === "fr" ? "default" : "outline"}
            onClick={() => setLanguage("fr")}
          >
            {t("authoring.languages.fr")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
          >
            {t("authoring.languages.en")}
          </Button>
        </div>
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-2 tablet-up:flex-row tablet-up:justify-end">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            {t("authoring.actions.cancel")}
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending
              ? t("authoring.actions.saving")
              : t("authoring.actions.save")}
          </Button>
        </div>
      }
    >
      {errors.length > 0 && (
        <ul className="mb-4 list-disc space-y-1 rounded-lg border border-destructive/40 bg-destructive/5 px-6 py-3 text-sm text-destructive">
          {errors.map((error, index) => (
            <li key={`${error.key}-${index}`}>{t(error.key, error.options)}</li>
          ))}
        </ul>
      )}

      {language === "en" && !content.enabled ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center">
          <div>
            <p className="text-sm font-semibold">
              {t("authoring.editor.addEnglish")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("authoring.editor.addEnglishDescription")}
            </p>
          </div>
          <AnimatedSwitch
            label={t("authoring.editor.addEnglish")}
            checked={content.enabled}
            onCheckedChange={(checked) =>
              updateContent("en", { enabled: checked })
            }
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="question-text">
                {t("authoring.editor.text")}
              </Label>
              <span className="text-xs text-muted-foreground">
                {content.text.length}/{MAX_QUESTION_TEXT}
              </span>
            </div>
            <Textarea
              id="question-text"
              rows={3}
              value={content.text}
              maxLength={MAX_QUESTION_TEXT}
              onChange={(event) =>
                updateContent(language, { text: event.target.value })
              }
              placeholder={t("authoring.editor.textPlaceholder", {
                lng: language,
              })}
            />
          </div>

          <div className="grid gap-2">
            <Label>{t("authoring.editor.answers")}</Label>
            {QUESTION_CHOICES.map((choice) => (
              <div key={choice} className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="correct-answer"
                  className="size-4 shrink-0 accent-primary"
                  checked={draft.correctAnswer === choice}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      correctAnswer: choice,
                    }))
                  }
                  aria-label={t("authoring.editor.correctAnswerAria", {
                    choice,
                  })}
                />
                <span className="w-4 text-sm font-semibold text-muted-foreground">
                  {choice}
                </span>
                <Input
                  value={content.answers[choice]}
                  onChange={(event) =>
                    updateAnswer(language, choice, event.target.value)
                  }
                  placeholder={t("authoring.editor.answerPlaceholder", {
                    choice,
                  })}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="question-image">
              {t("authoring.editor.image")}
            </Label>
            <MediaUpload
              value={draft.imageUrl.trim() ? draft.imageUrl : null}
              onChange={(url) =>
                setDraft((current) => ({ ...current, imageUrl: url ?? "" }))
              }
              aspectClassName="aspect-square max-w-32"
            />
          </div>
        </div>
      )}
    </AppDialog>
  )
}
