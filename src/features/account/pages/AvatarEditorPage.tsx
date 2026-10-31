import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  ArrowCounterClockwiseIcon,
  DiceFiveIcon,
  PaintBucketIcon,
  ShapesIcon,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs"
import { AvatarEditor } from "@/shared/components/avatar-editor"
import { UserAvatar } from "@/shared/components/user-avatar"
import { randomAvatarOptions, seedAvatarOptions } from "@/shared/avatar/avatar"
import {
  BASE_AVATAR_STYLE,
  BASE_BACKGROUND_GROUP_ID,
  DEFAULT_BASE_AVATAR_BACKGROUND,
  isBaseAvatarConfig,
  parseAvatarConfig,
  type AvatarConfig,
  type AvatarPresetId,
} from "@/shared/avatar/config"
import { BACKGROUND_COLORS } from "@/shared/avatar/styles/palettes"
import {
  STYLE_GROUP_ID,
  defaultOptionsFor,
  getAvatarStyle,
  loadAllAvatarStyles,
  resolveAvatarStyleId,
} from "@/shared/avatar/styles"
import { useGoBack } from "@/shared/hooks/useGoBack"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { PageContainer, useMe, type Me } from "@/features/shell"
import { useUpdateProfile } from "../hooks/useUpdateProfile"

/**
 * Édition de l'avatar en **page dédiée** (`/settings/avatar`) : aperçu live dans un
 * bandeau collant, onglets par groupe, sections en cards et enregistrement explicite
 * (Valider/Annuler) — la confirmation passe par un toast.
 */
export function AvatarEditorPage() {
  const { t } = useTranslation()
  const meQuery = useMe()
  const [stylesReady, setStylesReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void loadAllAvatarStyles().then(() => {
      if (!cancelled) setStylesReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (meQuery.isLoading || !stylesReady) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("avatar.editor.loading")}
        </p>
      </PageContainer>
    )
  }

  if (!meQuery.data) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("avatar.editor.loadError")}
        </p>
      </PageContainer>
    )
  }

  return (
    <AvatarEditorContent
      key={meQuery.data.userId}
      me={meQuery.data}
      userId={meQuery.userId}
    />
  )
}

function AvatarEditorContent({
  me,
  userId,
}: {
  me: Me
  userId: string | null
}) {
  const { t } = useTranslation()
  const update = useUpdateProfile()
  const goBack = useGoBack("/settings")
  const name = me.pseudonym ?? t("shell.settings.fallbackPlayer")
  const seed = userId ?? name
  const premium = me.premium === true
  const micahUnlocked = premium || me.rewards?.includes("MICAH_AVATAR") === true
  // Démarre de l'avatar **courant**. Micah est conservé s'il est débloqué par récompense ou
  // Premium ; sinon on repart sur l'avatar de base gratuit.
  const [draft, setDraft] = useState<AvatarConfig>(() => {
    const stored = parseAvatarConfig(me.avatarOptions)
    if (stored && (premium || micahUnlocked || isBaseAvatarConfig(stored)))
      return stored
    return {
      style: BASE_AVATAR_STYLE,
      backgroundColor: DEFAULT_BASE_AVATAR_BACKGROUND,
    }
  })
  const [baseline] = useState(draft)
  const isBase = draft.style === BASE_AVATAR_STYLE
  const style = isBase
    ? null
    : getAvatarStyle(resolveAvatarStyleId(draft.style))
  const groups = style?.groups ?? []
  const [groupId, setGroupId] = useState(() =>
    isBase ? STYLE_GROUP_ID : (style?.groups[0]?.id ?? STYLE_GROUP_ID)
  )

  const isDirty = !sameConfig(draft, baseline)

  function handleStyleChange(styleId: AvatarPresetId) {
    if (styleId === BASE_AVATAR_STYLE) {
      setDraft({
        style: BASE_AVATAR_STYLE,
        backgroundColor: isBase
          ? draft.backgroundColor
          : DEFAULT_BASE_AVATAR_BACKGROUND,
      })
      return
    }
    const unlocked = styleId === "micah" ? micahUnlocked : premium
    if (!unlocked || style?.id === styleId) return
    // On reste sur l'onglet « Style » : le choix d'un style ne doit pas renvoyer
    // sur le premier onglet de personnalisation du nouveau style.
    setDraft(seedAvatarOptions(seed, styleId))
  }

  function handleRandom() {
    if (isBase) {
      const next =
        BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)]
      setDraft({
        style: BASE_AVATAR_STYLE,
        backgroundColor: next,
      })
      return
    }
    if (style) setDraft(randomAvatarOptions(style.id))
  }

  function handleReset() {
    if (isBase) {
      setDraft({
        style: BASE_AVATAR_STYLE,
        backgroundColor: DEFAULT_BASE_AVATAR_BACKGROUND,
      })
      return
    }
    if (style) setDraft(defaultOptionsFor(style.id))
  }

  function handleSave() {
    if (!isDirty || update.isPending) return
    void update
      .mutateAsync({ avatarOptions: JSON.stringify(draft) })
      .then(() => {
        showSuccessToast(t("avatar.editor.saved"))
        goBack()
      })
      .catch(() => undefined)
  }

  const tabs = [
    {
      id: STYLE_GROUP_ID,
      labelKey: "avatar.editor.style" as const,
      icon: ShapesIcon,
    },
    ...(isBase
      ? [
          {
            id: BASE_BACKGROUND_GROUP_ID,
            labelKey: "avatar.sections.background" as const,
            icon: PaintBucketIcon,
          },
        ]
      : groups.map((group) => ({
          id: group.id,
          labelKey: group.labelKey,
          icon: group.icon,
        }))),
  ]

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-[var(--qu-topbar-offset,0rem)] z-20 flex flex-col">
        <div
          data-slot="avatar-preview-banner"
          className="qu-scroll-chrome border-b"
        >
          <div className="mx-auto flex w-full max-w-screen-xl items-center justify-center gap-4 px-(--page-gutter-x) py-4">
            <UserAvatar
              name={name}
              userId={userId ?? undefined}
              avatarOptions={JSON.stringify(draft)}
              size={112}
              eloFrame={false}
            />
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={handleRandom}
              >
                <DiceFiveIcon /> {t("avatar.editor.random")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={update.isPending}
                onClick={handleReset}
              >
                <ArrowCounterClockwiseIcon /> {t("avatar.editor.reset")}
              </Button>
            </div>
          </div>
        </div>

        <div className="qu-scroll-chrome border-b">
          <div className="mx-auto w-full max-w-screen-xl px-(--page-gutter-x) py-3">
            <Tabs value={groupId} onValueChange={setGroupId}>
              <TabsList>
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    <tab.icon />
                    {t(tab.labelKey)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <PageContainer className="flex-1 pb-8">
        <AvatarEditor
          draft={draft}
          groupId={groupId}
          groups={groups}
          premium={premium}
          micahUnlocked={micahUnlocked}
          seed={seed}
          onDraftChange={setDraft}
          onStyleChange={handleStyleChange}
        />
      </PageContainer>

      <div className="sticky bottom-0 z-20 border-t bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-end gap-2 px-(--page-gutter-x) py-3">
          <Button
            variant="outline"
            disabled={update.isPending}
            onClick={goBack}
          >
            {t("avatar.editor.cancel")}
          </Button>
          <Button disabled={!isDirty || update.isPending} onClick={handleSave}>
            {update.isPending
              ? t("avatar.editor.saving")
              : t("avatar.editor.save")}
          </Button>
        </div>
      </div>
    </div>
  )
}

function sameConfig(a: AvatarConfig, b: AvatarConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
