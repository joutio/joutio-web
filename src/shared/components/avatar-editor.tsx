import { memo, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { CheckIcon, LockIcon } from "@phosphor-icons/react"
import { cn } from "cn"
import { Card, CardContent } from "@/components/ui/card"
import {
  ColorSelector,
  ColorSelectorItem,
  ColorSelectorLabel,
  ColorSelectorList,
} from "@/components/motion/color-selector"
import { avatarDataUri } from "@/shared/avatar/avatar"
import {
  BASE_AVATAR_STYLE,
  BASE_BACKGROUND_GROUP_ID,
  baseAvatarBackground,
  type AvatarConfig,
  type AvatarPresetId,
} from "@/shared/avatar/config"
import { BACKGROUND_COLORS } from "@/shared/avatar/styles/palettes"
import { DefaultAvatar } from "@/shared/components/default-avatar"
import {
  AVATAR_STYLE_IDS,
  NONE_LABEL_KEY,
  STYLE_GROUP_ID,
  getAvatarStyle,
  humanizeVariant,
  resolveAvatarStyleId,
  type AvatarOptions,
  type AvatarStyleGroup,
  type AvatarStyleSection,
} from "@/shared/avatar/styles"

interface AvatarEditorProps {
  /** Options en cours d'édition (contrôlé : l'aperçu est porté par le bandeau). */
  draft: AvatarConfig
  onDraftChange: (draft: AvatarConfig) => void
  /** Changement de style (réinitialise le brouillon sur le seed du nouveau style). */
  onStyleChange: (styleId: AvatarPresetId) => void
  /** Les styles Lorelei/Notionists sont réservés aux comptes Premium. */
  premium: boolean
  /** Micah est débloqué par la récompense d'assiduité (ou Premium). */
  micahUnlocked: boolean
  /** Groupe actif (onglets gérés par la page). */
  groupId: string
  /** Groupes du style courant. */
  groups: AvatarStyleGroup[]
  /** Seed de prévisualisation des tuiles de style (userId/nom). */
  seed?: string
  className?: string
}

const TRANSPARENT_STYLE = {
  backgroundImage:
    "linear-gradient(135deg, transparent 44%, #ef4444 44%, #ef4444 56%, transparent 56%), linear-gradient(45deg, #e4e4e7 25%, #ffffff 25%, #ffffff 50%, #e4e4e7 50%, #e4e4e7 75%, #ffffff 75%)",
  backgroundSize: "100% 100%, 10px 10px",
}

type PickOption = (key: string, value: string) => void

/**
 * Sections du groupe actif : chaque section (Yeux, Cheveux…) est englobée dans une `Card`.
 * Contrôlé : toute modification remonte via `onDraftChange`. L'onglet « Style » affiche le
 * sélecteur de l’avatar de base gratuit et des styles DiceBear Premium (Micah/Lorelei/Notionists).
 */
export function AvatarEditor({
  draft,
  onDraftChange,
  onStyleChange,
  premium,
  micahUnlocked,
  groupId,
  groups,
  seed,
  className,
}: AvatarEditorProps) {
  const setOption = useCallback<PickOption>(
    (key, optionValue) => {
      if (draft.style === BASE_AVATAR_STYLE) return
      onDraftChange({ ...draft, [key]: optionValue })
    },
    [draft, onDraftChange]
  )

  if (groupId === BASE_BACKGROUND_GROUP_ID) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <BaseBackgroundPicker draft={draft} onDraftChange={onDraftChange} />
      </div>
    )
  }

  if (groupId === STYLE_GROUP_ID) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <StylePicker
          draft={draft}
          seed={seed}
          premium={premium}
          micahUnlocked={micahUnlocked}
          onStyleChange={onStyleChange}
        />
      </div>
    )
  }

  const group = groups.find((g) => g.id === groupId) ?? groups[0]

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {group.sections.map((section) => (
        <Card key={section.id} size="sm">
          <CardContent className="flex flex-col gap-3">
            <SectionBlock
              section={section}
              draft={draft as AvatarOptions}
              onPick={setOption}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function StylePicker({
  draft,
  seed,
  premium,
  micahUnlocked,
  onStyleChange,
}: {
  draft: AvatarConfig
  seed?: string
  premium: boolean
  micahUnlocked: boolean
  onStyleChange: (styleId: AvatarPresetId) => void
}) {
  const { t } = useTranslation()
  const current =
    draft.style === BASE_AVATAR_STYLE
      ? BASE_AVATAR_STYLE
      : resolveAvatarStyleId(draft.style)

  const options: AvatarPresetId[] = [BASE_AVATAR_STYLE, ...AVATAR_STYLE_IDS]

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("avatar.editor.style")}
        </h3>
        <div className="grid grid-cols-3 gap-2 tablet-up:grid-cols-4 desktop:grid-cols-5">
          {options.map((styleId) => {
            const unlocked =
              styleId === BASE_AVATAR_STYLE ||
              (styleId === "micah" ? micahUnlocked || premium : premium)
            const locked = !unlocked
            const selected = current === styleId
            const style =
              styleId === BASE_AVATAR_STYLE ? null : getAvatarStyle(styleId)
            return (
              <button
                key={styleId}
                type="button"
                disabled={locked}
                onClick={() => onStyleChange(styleId)}
                aria-pressed={selected}
                title={
                  styleId === BASE_AVATAR_STYLE
                    ? t("avatar.styles.base")
                    : t(style!.labelKey)
                }
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border hover:border-foreground/30 hover:bg-muted/50",
                  locked && "cursor-not-allowed opacity-55"
                )}
              >
                {styleId === BASE_AVATAR_STYLE ? (
                  <DefaultAvatar
                    backgroundColor={
                      draft.style === BASE_AVATAR_STYLE
                        ? baseAvatarBackground(draft)
                        : BACKGROUND_COLORS[0]
                    }
                    className="size-14"
                  />
                ) : (
                  <img
                    src={avatarDataUri({ style: styleId }, 72, seed)}
                    alt=""
                    className="size-14"
                  />
                )}
                <span
                  className={cn(
                    "max-w-full truncate text-xs leading-tight",
                    selected
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {styleId === BASE_AVATAR_STYLE
                    ? t("avatar.styles.base")
                    : t(style!.labelKey)}
                </span>
                {locked ? (
                  <span className="absolute top-1 right-1 flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground">
                    <LockIcon className="size-2.5" aria-hidden />
                    {styleId === "micah" && !premium
                      ? t("avatar.editor.assiduityRequired")
                      : t("avatar.editor.premium")}
                  </span>
                ) : (
                  selected && (
                    <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                      <CheckIcon className="size-3" />
                    </span>
                  )
                )}
              </button>
            )
          })}
        </div>
        {(!premium || !micahUnlocked) && (
          <p className="rounded-lg border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
            {!micahUnlocked
              ? t("avatar.editor.micahRequired")
              : t("avatar.editor.premiumRequired")}
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("avatar.editor.credits")}
        </p>
      </CardContent>
    </Card>
  )
}

function BaseBackgroundPicker({
  draft,
  onDraftChange,
}: {
  draft: AvatarConfig
  onDraftChange: (draft: AvatarConfig) => void
}) {
  const { t } = useTranslation()
  const selected =
    draft.style === BASE_AVATAR_STYLE
      ? baseAvatarBackground(draft)
      : BACKGROUND_COLORS[0]

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t("avatar.editor.background")}
        </h3>
        <ColorSelector
          value={selected}
          onValueChange={(color) =>
            onDraftChange({
              style: BASE_AVATAR_STYLE,
              backgroundColor: color,
            })
          }
        >
          <ColorSelectorList className="gap-2 p-0">
            {BACKGROUND_COLORS.map((color) => (
              <ColorSelectorItem
                key={color}
                value={color}
                color={color}
                label={color}
              />
            ))}
          </ColorSelectorList>
        </ColorSelector>
      </CardContent>
    </Card>
  )
}

function SectionBlock({
  section,
  draft,
  onPick,
}: {
  section: AvatarStyleSection
  draft: AvatarOptions
  onPick: PickOption
}) {
  const { t } = useTranslation()
  const field = section.variantField
  const variants = section.allowsNone
    ? ["none", ...(section.variants ?? [])]
    : [...(section.variants ?? [])]

  const variantLabel = (variant: string): string => {
    if (variant === "none") return t(NONE_LABEL_KEY)
    const labelKey = section.labelKeys?.[variant]
    if (labelKey) return t(labelKey)
    const humanized = humanizeVariant(variant)
    return humanized ? t(humanized.key, { number: humanized.number }) : variant
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <section.icon className="size-3.5" />
        {t(section.labelKey)}
      </h3>

      {field && (
        <div className="grid grid-cols-2 gap-2 tablet-up:grid-cols-3 desktop:grid-cols-4">
          {variants.map((variant) => {
            const selected = draft[field] === variant
            const tile: AvatarOptions = { ...draft, [field]: variant }
            return (
              <VariantTile
                key={variant}
                dataUri={avatarDataUri(tile, 72)}
                label={variantLabel(variant)}
                selected={selected}
                field={field}
                value={variant}
                onPick={onPick}
              />
            )
          })}
        </div>
      )}

      {section.colorField && (
        <ColorSelector
          value={draft[section.colorField] ?? ""}
          onValueChange={(value) => onPick(section.colorField!, value)}
        >
          <ColorSelectorLabel className="mb-4 text-xs font-normal text-muted-foreground">
            {section.colorLabelKey
              ? t(section.colorLabelKey)
              : t("avatar.color")}
          </ColorSelectorLabel>
          <ColorSelectorList className="gap-2 p-0">
            {(section.colors ?? []).map((color) => (
              <ColorSelectorItem
                key={color || "transparent"}
                value={color}
                color={color || "transparent"}
                label={color || t("avatar.transparent")}
                dotStyle={color ? undefined : TRANSPARENT_STYLE}
              />
            ))}
          </ColorSelectorList>
        </ColorSelector>
      )}
    </section>
  )
}

const VariantTile = memo(function VariantTile({
  dataUri,
  label,
  selected,
  field,
  value,
  onPick,
}: {
  dataUri: string
  label: string
  selected: boolean
  field: string
  value: string
  onPick: PickOption
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(field, value)}
      aria-pressed={selected}
      title={label}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
          : "border-border hover:border-foreground/30 hover:bg-muted/50"
      )}
    >
      <img src={dataUri} alt="" className="size-14" />
      <span
        className={cn(
          "line-clamp-2 min-h-8 w-full text-center text-xs leading-tight",
          selected ? "font-semibold text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
      {selected && (
        <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon className="size-3" />
        </span>
      )}
    </button>
  )
})
