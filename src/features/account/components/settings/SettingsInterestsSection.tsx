import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { FormSection } from "@/shared/components/form-section"
import { showSuccessToast } from "@/shared/utils/success-toast"
import { showToast } from "@/shared/utils/toast"
import { InterestProfileForm } from "@/features/topics"
import { useUpdateInterests } from "@/features/shell"

interface SettingsInterestsSectionProps {
  initialInterests: string[]
}

/**
 * Édition des centres d'intérêt du joueur : mêmes tuiles d'univers que l'onboarding, sans
 * compteur. Le premier univers est le principal ; l'enregistrement alimente le rail « Pour toi »
 * de l'accueil.
 */
export function SettingsInterestsSection({
  initialInterests,
}: SettingsInterestsSectionProps) {
  const { t } = useTranslation()
  const update = useUpdateInterests()
  const [draft, setDraft] = useState<string[]>(initialInterests)
  const dirty =
    draft.length !== initialInterests.length ||
    draft.some((code, index) => code !== initialInterests[index])

  function save() {
    if (!dirty || update.isPending) return
    void update
      .mutateAsync(draft)
      .then(() => {
        showSuccessToast(t("shell.settings.interests.saved"), {
          id: "settings-interests",
        })
      })
      .catch(() => {
        showToast({
          tone: "danger",
          title: t("shell.settings.interests.saveError"),
          id: "settings-interests",
        })
      })
  }

  return (
    <FormSection
      title={t("shell.settings.interests.title")}
      sub={t("shell.settings.interests.sub")}
    >
      <div className="py-3">
        <InterestProfileForm
          value={draft}
          onChange={setDraft}
          min={0}
          max={3}
          disabled={update.isPending}
        />
        <div className="mt-4 flex justify-end">
          <Button disabled={!dirty || update.isPending} onClick={save}>
            {update.isPending
              ? t("shell.settings.interests.saving")
              : t("shell.settings.interests.save")}
          </Button>
        </div>
      </div>
    </FormSection>
  )
}
