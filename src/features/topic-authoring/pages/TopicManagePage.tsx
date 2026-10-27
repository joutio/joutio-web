import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Rocket } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/shared/components/empty-state"
import { Progress } from "@/components/ui/progress"
import { PageContainer, useTopicName } from "@/features/shell"
import { TopicIcon } from "@/shared/components/topic-icon"
import { useTopicOverview } from "@/features/topic-detail"
import type { QuestionEditor } from "../domain/topic-authoring"
import { QuestionCard } from "../components/QuestionCard"
import { QuestionEditorDialog } from "../components/QuestionEditorDialog"
import { QuestionReportsDialog } from "../components/QuestionReportsDialog"
import { TopicSettingsCard } from "../components/TopicSettingsCard"
import {
  useModerateQuestion,
  usePublishTopic,
  useTopicQuestions,
  useUpdateTopic,
} from "../hooks/useTopicAuthoring"
import { MIN_QUESTIONS_TO_PUBLISH } from "@/features/topics/domain/topic"

interface EditorState {
  question: QuestionEditor | null
}

export function TopicManagePage() {
  const { t } = useTranslation()
  const { topicId = "" } = useParams()
  const resolveName = useTopicName()
  const overview = useTopicOverview(topicId)
  const questions = useTopicQuestions(topicId)
  const updateTopic = useUpdateTopic(topicId)
  const publish = usePublishTopic(topicId)
  const moderate = useModerateQuestion()
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [reportsFor, setReportsFor] = useState<QuestionEditor | null>(null)

  if (overview.isLoading) {
    return (
      <PageContainer className="max-w-3xl">
        <div className="h-30 animate-pulse rounded-2xl bg-muted/50" />
      </PageContainer>
    )
  }

  if (overview.isError || !overview.data) {
    return (
      <PageContainer className="max-w-3xl">
        <EmptyState title={t("authoring.manage.notFound")}>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to="/topics?mine=true" />}
          >
            {t("authoring.manage.back")}
          </Button>
        </EmptyState>
      </PageContainer>
    )
  }

  const { topic, canManage } = overview.data

  if (!canManage) {
    return (
      <PageContainer className="max-w-3xl">
        <EmptyState
          title={t("authoring.manage.restrictedTitle")}
          description={t("authoring.manage.restrictedDescription")}
        >
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to={`/topics/${topicId}`} />}
          >
            {t("authoring.manage.view")}
          </Button>
        </EmptyState>
      </PageContainer>
    )
  }

  const questionList = questions.data?.content ?? []
  const approved = questions.data
    ? questionList.filter(
        (question) =>
          question.status === "APPROVED" &&
          !question.suspended &&
          !question.archived
      ).length
    : topic.questionsCount
  const pending = questionList.filter(
    (question) => question.status === "PENDING"
  ).length
  const isDraft = topic.status === "DRAFT"
  const canPublish =
    isDraft && approved >= MIN_QUESTIONS_TO_PUBLISH && !publish.isPending

  return (
    <PageContainer className="max-w-3xl">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2"
        nativeButton={false}
        render={<Link to="/topics?mine=true" />}
      >
        <ArrowLeft /> {t("authoring.topics.back")}
      </Button>

      <Card className="mb-5">
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <TopicIcon topic={topic} size={64} className="shadow-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-lg font-bold">
                  {resolveName(topic.names)}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    topic.status === "PUBLISHED"
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                      : undefined
                  }
                >
                  {topic.status === "PUBLISHED"
                    ? t("authoring.status.published")
                    : t("authoring.status.draft")}
                </Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {topic.categoryLabel} ·{" "}
                {approved > 1
                  ? t("authoring.manage.approvedMany", { count: approved })
                  : t("authoring.manage.approvedOne", { count: approved })}
                {pending > 0
                  ? ` · ${t("authoring.manage.pendingCount", { count: pending })}`
                  : ""}
              </p>
            </div>
            {isDraft && (
              <Button onClick={() => publish.mutate()} disabled={!canPublish}>
                <Rocket />
                {publish.isPending
                  ? t("authoring.manage.publishing")
                  : t("authoring.manage.publish")}
              </Button>
            )}
            {topic.status === "PUBLISHED" && (
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link to={`/topics/${topicId}`} />}
              >
                {t("authoring.manage.view")}
              </Button>
            )}
          </div>

          {isDraft && (
            <div className="flex items-center gap-3">
              <Progress
                value={
                  (Math.min(approved, MIN_QUESTIONS_TO_PUBLISH) /
                    MIN_QUESTIONS_TO_PUBLISH) *
                  100
                }
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">
                {t("authoring.manage.publishProgress", {
                  approved,
                  minimum: MIN_QUESTIONS_TO_PUBLISH,
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <TopicSettingsCard
        topic={topic}
        saving={updateTopic.isPending}
        onSave={(patch) => updateTopic.mutate(patch)}
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-bold">
            {t("authoring.manage.questions")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("authoring.manage.questionsSub")}
          </p>
        </div>
        <Button variant="outline" onClick={() => setEditor({ question: null })}>
          <Plus /> {t("authoring.manage.addQuestion")}
        </Button>
      </div>

      {questions.isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-26 animate-pulse rounded-xl bg-muted/50"
            />
          ))}
        </div>
      ) : questionList.length === 0 ? (
        <EmptyState
          title={t("authoring.manage.emptyTitle")}
          description={t("authoring.manage.emptyDescription", {
            minimum: MIN_QUESTIONS_TO_PUBLISH,
          })}
          className="py-10"
        >
          <Button onClick={() => setEditor({ question: null })}>
            <Plus /> {t("authoring.manage.addQuestion")}
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {questionList.map((question) => (
            <QuestionCard
              key={question.questionId}
              question={question}
              busy={moderate.isPending}
              onEdit={() => setEditor({ question })}
              onApprove={() =>
                moderate.mutate({
                  questionId: question.questionId,
                  action: "approve",
                })
              }
              onReject={() =>
                moderate.mutate({
                  questionId: question.questionId,
                  action: "reject",
                })
              }
              onReports={() => setReportsFor(question)}
            />
          ))}
        </div>
      )}

      {editor && (
        <QuestionEditorDialog
          key={editor.question?.questionId ?? "new"}
          topicId={topicId}
          question={editor.question}
          onClose={() => setEditor(null)}
        />
      )}

      {reportsFor && (
        <QuestionReportsDialog
          topicId={topicId}
          question={reportsFor}
          onClose={() => setReportsFor(null)}
          onEdit={() => {
            const question = reportsFor
            setReportsFor(null)
            setEditor({ question })
          }}
        />
      )}
    </PageContainer>
  )
}
