import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BottomNavVariant } from "@/components/ui/bottom-nav-bar"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { useDevice, useIsTouchLayout } from "@/shared/hooks/use-device"
import type { Language } from "@/features/player/domain/profile"
import {
  useBottomNavStore,
  useTheme,
  useTopicGridStore,
  type Me,
  type Theme,
  type TopicGridColumns,
} from "@/features/shell"
import type { UpdateProfilePatch } from "../../hooks/useUpdateProfile"

const LANGS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
]

interface SettingsAppearanceSectionProps {
  me?: Me
  onSavePatch: (patch: UpdateProfilePatch) => Promise<void>
}

/** Section « Apparence » : thème, nav basse (tactile) et langue d'interface (profil serveur). */
export function SettingsAppearanceSection({
  me,
  onSavePatch,
}: SettingsAppearanceSectionProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const isTouch = useIsTouchLayout()
  const isCompact = useDevice() === "compact"
  const bottomNavVariant = useBottomNavStore((state) => state.variant)
  const setBottomNavVariant = useBottomNavStore((state) => state.setVariant)
  const topicColumns = useTopicGridStore((state) => state.columns)
  const setTopicColumns = useTopicGridStore((state) => state.setColumns)

  const themes: { value: Theme; label: string }[] = [
    { value: "light", label: t("shell.settings.theme.light") },
    { value: "dark", label: t("shell.settings.theme.dark") },
    { value: "system", label: t("shell.settings.theme.system") },
  ]

  const topicColumnOptions: { value: string; label: string }[] = [
    { value: "3", label: t("shell.settings.topicGrid.columns3") },
    { value: "4", label: t("shell.settings.topicGrid.columns4") },
  ]

  const bottomNavVariants: { value: BottomNavVariant; label: string }[] = [
    { value: "fixed", label: t("shell.settings.bottomNav.fixed") },
    { value: "floating", label: t("shell.settings.bottomNav.floating") },
  ]

  return (
    <FormSection title={t("shell.settings.sections.appearance")}>
      <FormRow
        label={t("shell.settings.theme.label")}
        description={t("shell.settings.theme.description")}
      >
        <Select
          items={themes}
          value={theme}
          onValueChange={(v) => setTheme(v as Theme)}
        >
          <SelectTrigger
            className="w-full"
            aria-label={t("shell.settings.theme.aria")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {themes.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>

      {isTouch && (
        <FormRow
          label={t("shell.settings.bottomNav.label")}
          description={t("shell.settings.bottomNav.description")}
        >
          <Select
            items={bottomNavVariants}
            value={bottomNavVariant}
            onValueChange={(v) => setBottomNavVariant(v as BottomNavVariant)}
          >
            <SelectTrigger
              className="w-full"
              aria-label={t("shell.settings.bottomNav.aria")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {bottomNavVariants.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      )}

      {isCompact && (
        <FormRow
          label={t("shell.settings.topicGrid.label")}
          description={t("shell.settings.topicGrid.description")}
        >
          <Select
            items={topicColumnOptions}
            value={String(topicColumns)}
            onValueChange={(value) =>
              setTopicColumns(Number(value) as TopicGridColumns)
            }
          >
            <SelectTrigger
              className="w-full"
              aria-label={t("shell.settings.topicGrid.aria")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {topicColumnOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>
      )}

      <FormRow
        label={t("shell.settings.language.label")}
        description={t("shell.settings.language.description")}
      >
        <Select
          items={LANGS}
          value={me?.language ?? "fr"}
          onValueChange={(v) => void onSavePatch({ language: v as Language })}
        >
          <SelectTrigger
            className="w-full"
            aria-label={t("shell.settings.language.aria")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGS.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>
    </FormSection>
  )
}
