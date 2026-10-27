import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PageContainer, useTheme } from "@/features/shell"
import { EmojiPickerField } from "@/shared/components/emoji-picker-field"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { MediaUpload } from "@/shared/components/media-upload"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryColor } from "@/shared/utils/categories"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { useTopicCategories } from "@/features/topics"
import { MIN_QUESTIONS_TO_PUBLISH } from "@/features/topics/domain/topic"
import { useCreateTopic } from "../hooks/useTopicAuthoring"

function buildTopicSchema(t: TFunction) {
  return z.object({
    nameFr: z
      .string()
      .trim()
      .min(1, t("authoring.create.validation.nameRequired"))
      .max(255, t("authoring.create.validation.max255")),
    nameEn: z.string().trim().max(255, t("authoring.create.validation.max255")),
    description: z
      .string()
      .max(500, t("authoring.create.validation.descriptionMax")),
    category: z
      .string()
      .min(1, t("authoring.create.validation.categoryRequired")),
    emoji: z.string().max(16, t("authoring.create.validation.emojiMax")),
    color: z.string(),
    imageUrl: z
      .string()
      .trim()
      .max(1024, t("authoring.create.validation.imageUrlMax"))
      .refine(
        (value) => value === "" || /^https?:\/\/.+/.test(value),
        t("authoring.create.validation.imageUrlRequired")
      ),
  })
}

type TopicValues = z.infer<ReturnType<typeof buildTopicSchema>>

export function CreateTopicPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const categories = useTopicCategories()
  const createTopic = useCreateTopic()

  const topicSchema = useMemo(() => buildTopicSchema(t), [t])

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TopicValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      nameFr: "",
      nameEn: "",
      description: "",
      category: "",
      emoji: "",
      color: "#6366f1",
      imageUrl: "",
    },
  })

  const nameFr = useWatch({ control, name: "nameFr" })
  const nameEn = useWatch({ control, name: "nameEn" })
  const description = useWatch({ control, name: "description" })
  const category = useWatch({ control, name: "category" })
  const emoji = useWatch({ control, name: "emoji" })
  const color = useWatch({ control, name: "color" })
  const imageUrl = useWatch({ control, name: "imageUrl" })

  const onSubmit = handleSubmit(async (form) => {
    const created = await createTopic.mutateAsync({
      names: {
        fr: form.nameFr.trim(),
        ...(form.nameEn.trim() ? { en: form.nameEn.trim() } : {}),
      },
      description: form.description.trim() || null,
      category: form.category,
      emoji: form.emoji.trim() || null,
      color: form.color || null,
      imageUrl: form.imageUrl.trim() || null,
    })
    showSuccessToast(t("authoring.create.success"))
    void navigate(`/topics/${created.id}/manage`)
  })

  const pending = createTopic.isPending || isSubmitting
  const categoryItems = (categories.data ?? []).map((item) => ({
    value: item.category,
    label: item.label,
  }))

  return (
    <PageContainer className="max-w-[880px]">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2"
        nativeButton={false}
        render={<Link to="/topics?mine=true" />}
      >
        <ArrowLeft /> {t("authoring.topics.back")}
      </Button>

      <div className="mb-5">
        <h1 className="font-heading text-xl font-bold">
          {t("authoring.create.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("authoring.create.subtitle", {
            minimum: MIN_QUESTIONS_TO_PUBLISH,
          })}
        </p>
      </div>

      <form onSubmit={(event) => void onSubmit(event)}>
        <FormSection
          title={t("authoring.create.section")}
          sub={t("authoring.create.sectionSub")}
        >
          <FormRow
            label={t("authoring.fields.preview")}
            description={t("authoring.fields.previewCreate")}
            controlClassName="flex tablet-up:justify-end"
          >
            <TopicIcon
              topic={{
                emoji: emoji.trim() || null,
                color: color || null,
                imageUrl: imageUrl.trim() || null,
                category: category || null,
              }}
              size={56}
              className="shadow-lg"
            />
          </FormRow>

          <FormRow
            label={t("authoring.fields.nameFr")}
            description={t("authoring.fields.nameFrDescription")}
            htmlFor="nameFr"
          >
            <Input
              id="nameFr"
              maxLength={255}
              autoFocus
              {...register("nameFr")}
            />
            {errors.nameFr ? (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.nameFr.message}
              </p>
            ) : (
              <p className="mt-1.5 text-right text-xs text-muted-foreground">
                {nameFr.length}/255
              </p>
            )}
          </FormRow>

          <FormRow
            label={t("authoring.fields.nameEn")}
            description={t("authoring.fields.nameEnDescription")}
            htmlFor="nameEn"
          >
            <Input
              id="nameEn"
              maxLength={255}
              placeholder={t("authoring.fields.nameEnPlaceholder")}
              {...register("nameEn")}
            />
            {errors.nameEn ? (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.nameEn.message}
              </p>
            ) : (
              <p className="mt-1.5 text-right text-xs text-muted-foreground">
                {nameEn.length}/255
              </p>
            )}
          </FormRow>

          <FormRow
            stacked
            label={t("authoring.fields.description")}
            description={t("authoring.fields.descriptionDescription")}
            htmlFor="description"
          >
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              placeholder={t("authoring.fields.descriptionPlaceholder")}
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : (
              <p className="mt-1.5 text-right text-xs text-muted-foreground">
                {description.length}/500
              </p>
            )}
          </FormRow>

          <FormRow
            label={t("authoring.fields.category")}
            description={t("authoring.fields.categoryDescription")}
          >
            <Select
              items={categoryItems}
              value={category}
              onValueChange={(value) =>
                setValue("category", value ?? "", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t("authoring.fields.categoryPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((item) => (
                  <SelectItem key={item.category} value={item.category}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.category.message}
              </p>
            )}
          </FormRow>

          <FormRow
            label={t("authoring.fields.emoji")}
            description={t("authoring.fields.emojiDescription")}
          >
            <EmojiPickerField
              theme={theme}
              value={emoji.trim() || null}
              onChange={(value) =>
                setValue("emoji", value ?? "", { shouldValidate: true })
              }
            />
            {errors.emoji && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.emoji.message}
              </p>
            )}
          </FormRow>
        </FormSection>

        <FormSection
          title={t("authoring.create.appearance")}
          sub={t("authoring.create.appearanceSub")}
        >
          <FormRow
            label={t("authoring.fields.accent")}
            description={t("authoring.fields.accentDescription")}
            controlClassName="flex items-center gap-2"
          >
            <input
              type="color"
              aria-label={t("authoring.fields.accentAria")}
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
              value={color || categoryColor(category)}
              onChange={(event) =>
                setValue("color", event.target.value, { shouldValidate: true })
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setValue("color", "", { shouldValidate: true })}
            >
              {t("authoring.fields.auto")}
            </Button>
          </FormRow>

          <FormRow
            stacked
            label={t("authoring.fields.illustration")}
            description={t("authoring.fields.illustrationDescription")}
            htmlFor="imageUrl"
          >
            <MediaUpload
              value={imageUrl || null}
              onChange={(url) =>
                setValue("imageUrl", url ?? "", { shouldValidate: true })
              }
              aspectClassName="aspect-square max-w-44"
              disabled={pending}
            />
            {errors.imageUrl && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.imageUrl.message}
              </p>
            )}
          </FormRow>
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate("/topics?mine=true")}
            disabled={pending}
          >
            {t("authoring.actions.cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {pending
              ? t("authoring.create.submitting")
              : t("authoring.create.submit")}
          </Button>
        </div>
      </form>
    </PageContainer>
  )
}
