import { useState } from "react"
import { useTranslation } from "react-i18next"
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
import { FormRow, FormSection } from "@/shared/components/form-section"
import { EmojiPickerField } from "@/shared/components/emoji-picker-field"
import { MediaUpload } from "@/shared/components/media-upload"
import { TopicIcon } from "@/shared/components/topic-icon"
import { categoryColor } from "@/shared/utils/categories"
import type { TranslationKey } from "@/lib/i18n/types"
import { useTheme } from "@/features/shell"
import { useTopicCategories, type TopicCard } from "@/features/topics"
import type { TopicPatch } from "../domain/topic-authoring"

interface TopicSettingsCardProps {
  topic: TopicCard
  saving: boolean
  onSave: (patch: TopicPatch) => void
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

/** Édition champ par champ du sujet — seuls les champs modifiés sont envoyés au BFF. */
export function TopicSettingsCard({
  topic,
  saving,
  onSave,
}: TopicSettingsCardProps) {
  const { t } = useTranslation()
  const categories = useTopicCategories()
  const { theme } = useTheme()
  const [nameFr, setNameFr] = useState(topic.names.fr ?? "")
  const [nameEn, setNameEn] = useState(topic.names.en ?? "")
  const [description, setDescription] = useState(topic.description ?? "")
  const [category, setCategory] = useState(topic.category ?? "")
  const [emoji, setEmoji] = useState(topic.emoji ?? "")
  const [color, setColor] = useState<string | null>(topic.color)
  const [imageUrl, setImageUrl] = useState(topic.imageUrl ?? "")
  const [bannerUrl, setBannerUrl] = useState(topic.bannerUrl ?? "")
  const [error, setError] = useState<TranslationKey | null>(null)

  const colorValue = color ?? categoryColor(category)
  const categoryItems = (categories.data ?? []).map((item) => ({
    value: item.category,
    label: item.label,
  }))

  const patch = (): TopicPatch => {
    const next: TopicPatch = {}
    const nameUpdates: NonNullable<TopicPatch["nameUpdates"]> = []
    if (nameFr.trim() && nameFr.trim() !== (topic.names.fr ?? "")) {
      nameUpdates.push({ language: "fr", name: nameFr.trim() })
    }
    if (nameEn.trim() && nameEn.trim() !== (topic.names.en ?? "")) {
      nameUpdates.push({ language: "en", name: nameEn.trim() })
    }
    if (nameUpdates.length > 0) next.nameUpdates = nameUpdates
    if (normalize(description) !== (topic.description ?? null))
      next.description = normalize(description)
    if (category && category !== topic.category) next.category = category
    if (normalize(emoji) !== (topic.emoji ?? null))
      next.emoji = normalize(emoji)
    if (color !== (topic.color ?? null)) next.color = color
    if (normalize(imageUrl) !== (topic.imageUrl ?? null))
      next.imageUrl = normalize(imageUrl)
    if (normalize(bannerUrl) !== (topic.bannerUrl ?? null))
      next.bannerUrl = normalize(bannerUrl)
    return next
  }

  const dirty = Object.keys(patch()).length > 0

  const submit = () => {
    const trimmedName = nameFr.trim()
    if (!trimmedName) {
      setError("authoring.settings.errors.nameRequired")
      return
    }
    if (trimmedName.length > 255 || nameEn.trim().length > 255) {
      setError("authoring.settings.errors.nameTooLong")
      return
    }
    if (description.trim().length > 500) {
      setError("authoring.settings.errors.descriptionTooLong")
      return
    }
    const normalizedImage = normalize(imageUrl)
    if (normalizedImage && !/^https?:\/\/.+/.test(normalizedImage)) {
      setError("authoring.settings.errors.imageUrlProtocol")
      return
    }
    const normalizedBanner = normalize(bannerUrl)
    if (normalizedBanner && !/^https?:\/\/.+/.test(normalizedBanner)) {
      setError("authoring.settings.errors.bannerUrlProtocol")
      return
    }
    setError(null)
    onSave(patch())
  }

  return (
    <FormSection
      title={t("authoring.settings.title")}
      sub={t("authoring.settings.sub")}
    >
      <FormRow
        label={t("authoring.fields.preview")}
        description={t("authoring.fields.previewManage")}
        controlClassName="flex tablet-up:justify-end"
      >
        <TopicIcon
          topic={{
            emoji: normalize(emoji),
            color,
            imageUrl: normalize(imageUrl),
            category,
          }}
          size={56}
          className="shadow-lg"
        />
      </FormRow>

      <FormRow
        label={t("authoring.fields.nameFr")}
        description={t("authoring.fields.nameFrDescription")}
        htmlFor="topic-name-fr"
      >
        <Input
          id="topic-name-fr"
          value={nameFr}
          maxLength={255}
          onChange={(event) => setNameFr(event.target.value)}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {nameFr.length}/255
        </p>
      </FormRow>

      <FormRow
        label={t("authoring.fields.nameEn")}
        description={t("authoring.fields.nameEnDescription")}
        htmlFor="topic-name-en"
      >
        <Input
          id="topic-name-en"
          value={nameEn}
          maxLength={255}
          placeholder={t("authoring.fields.nameEnPlaceholder")}
          onChange={(event) => setNameEn(event.target.value)}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {nameEn.length}/255
        </p>
      </FormRow>

      <FormRow
        stacked
        label={t("authoring.fields.description")}
        description={t("authoring.fields.descriptionDescription")}
        htmlFor="topic-description"
      >
        <Textarea
          id="topic-description"
          value={description}
          maxLength={500}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {description.length}/500
        </p>
      </FormRow>

      <FormRow
        label={t("authoring.fields.category")}
        description={t("authoring.fields.categoryDescription")}
      >
        <Select
          items={categoryItems}
          value={category}
          onValueChange={(value) => setCategory(value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={t("authoring.fields.categoryPlaceholder")}
            />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>

      <FormRow
        label={t("authoring.fields.emoji")}
        description={t("authoring.fields.emojiDescription")}
      >
        <EmojiPickerField
          theme={theme}
          value={normalize(emoji)}
          onChange={(value) => setEmoji(value ?? "")}
        />
      </FormRow>

      <FormRow
        label={t("authoring.fields.accent")}
        description={t("authoring.fields.accentDescription")}
        controlClassName="flex items-center gap-2"
      >
        <input
          type="color"
          aria-label={t("authoring.fields.accentAria")}
          className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
          value={colorValue}
          onChange={(event) => setColor(event.target.value)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setColor(null)}
          disabled={color === null}
        >
          {t("authoring.fields.auto")}
        </Button>
      </FormRow>

      <FormRow
        stacked
        label={t("authoring.fields.illustration")}
        description={t("authoring.fields.illustrationDescription")}
        htmlFor="topic-image"
      >
        <MediaUpload
          value={normalize(imageUrl)}
          onChange={(url) => setImageUrl(url ?? "")}
          aspectClassName="aspect-square max-w-44"
          disabled={saving}
        />
      </FormRow>

      <FormRow
        stacked
        label={t("authoring.fields.banner")}
        description={t("authoring.fields.bannerDescription")}
        htmlFor="topic-banner"
      >
        <MediaUpload
          value={normalize(bannerUrl)}
          onChange={(url) => setBannerUrl(url ?? "")}
          aspectClassName="aspect-video"
          disabled={saving}
        />
      </FormRow>

      {error && <p className="pt-3 text-sm text-destructive">{t(error)}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setNameFr(topic.names.fr ?? "")
            setNameEn(topic.names.en ?? "")
            setDescription(topic.description ?? "")
            setCategory(topic.category ?? "")
            setEmoji(topic.emoji ?? "")
            setColor(topic.color)
            setImageUrl(topic.imageUrl ?? "")
            setBannerUrl(topic.bannerUrl ?? "")
            setError(null)
          }}
          disabled={!dirty || saving}
        >
          {t("authoring.actions.cancel")}
        </Button>
        <Button onClick={submit} disabled={!dirty || saving}>
          {saving ? t("authoring.actions.saving") : t("authoring.actions.save")}
        </Button>
      </div>
    </FormSection>
  )
}
