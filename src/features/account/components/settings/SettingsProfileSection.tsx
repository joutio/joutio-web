import { useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormRow, FormSection } from "@/shared/components/form-section"
import { MediaUpload } from "@/shared/components/media-upload"
import { UserAvatar } from "@/shared/components/user-avatar"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"
import type { Me } from "@/features/shell"
import type { UpdateProfilePatch } from "../../hooks/useUpdateProfile"

const COUNTRY_CODES = ["FR", "BE", "CH", "CA", "SN", "JP"] as const

type ProfileValues = z.infer<ReturnType<typeof buildProfileSchema>>

function buildProfileSchema(t: TFunction) {
  return z.object({
    pseudonym: z
      .string()
      .min(1, t("shell.settings.pseudonym.required"))
      .max(40, t("shell.settings.pseudonym.max")),
    bio: z.string().max(160, t("shell.settings.bio.max")),
    country: z.string(),
  })
}

interface SettingsProfileSectionProps {
  me?: Me
  userId?: string | null
  onSavePatch: (patch: UpdateProfilePatch) => Promise<void>
}

/**
 * Section « Profil » des réglages : avatar, pseudonyme, bio, pays — enregistrement **par champ**
 * (texte au blur après validation, selects immédiatement).
 */
export function SettingsProfileSection({
  me,
  userId,
  onSavePatch,
}: SettingsProfileSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const locale = useLocale()

  const countries = COUNTRY_CODES.map((code) => ({
    value: code,
    label: `${countryFlag(code)} ${countryLabel(code, locale)}`,
  }))

  const profileSchema = useMemo(() => buildProfileSchema(t), [t])

  const {
    register,
    reset,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur",
    defaultValues: { pseudonym: "", bio: "", country: "FR" },
  })

  // Initialisation unique par joueur : on ne réinitialise pas le formulaire à chaque
  // mise à jour optimiste du profil (sinon la saisie en cours serait écrasée).
  const initializedFor = useRef<string | null>(null)
  useEffect(() => {
    if (me && initializedFor.current !== me.userId) {
      initializedFor.current = me.userId
      reset({
        pseudonym: me.pseudonym ?? "",
        bio: me.bio ?? "",
        country: me.country ?? "FR",
      })
    }
  }, [me, reset])

  /** Pseudonyme : validé puis enregistré au blur, uniquement s'il a changé. */
  async function savePseudonym() {
    if (!(await trigger("pseudonym"))) return
    const value = getValues("pseudonym")
    if (value === (me?.pseudonym ?? "")) return
    await onSavePatch({ pseudonym: value })
  }

  /** Bio : validée puis enregistrée au blur (vide ⇒ null), uniquement si changée. */
  async function saveBio() {
    if (!(await trigger("bio"))) return
    const value = getValues("bio")
    if (value === (me?.bio ?? "")) return
    await onSavePatch({ bio: value || null })
  }

  /** Pays : enregistrement immédiat (select), uniquement s'il a changé. */
  function saveCountry(value: string) {
    if (value === (me?.country ?? "FR")) return
    void onSavePatch({ country: value || null })
  }

  const rating = me?.progression.rating ?? 200
  const provisional = me?.progression.provisional ?? true
  const country =
    me?.country && COUNTRY_CODES.some((code) => code === me.country)
      ? me.country
      : "FR"
  const pseudonymField = register("pseudonym")
  const bioField = register("bio")

  return (
    <FormSection title={t("shell.settings.sections.profile")}>
      <FormRow
        label={t("shell.settings.avatar.label")}
        description={t("shell.settings.avatar.description", {
          rating,
          provisional,
        })}
        controlClassName="flex tablet-up:justify-end"
      >
        <button
          type="button"
          onClick={() => void navigate("/settings/avatar")}
          aria-label={t("shell.settings.avatar.changeAria")}
          className="group relative shrink-0 rounded-full"
        >
          <UserAvatar
            name={me?.pseudonym ?? t("shell.settings.fallbackPlayer")}
            userId={userId ?? undefined}
            avatarOptions={me?.avatarOptions ?? undefined}
            size={56}
          />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/45 text-2xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            {t("shell.settings.avatar.edit")}
          </span>
        </button>
      </FormRow>

      <FormRow
        stacked
        label={t("shell.settings.banner.label")}
        description={t("shell.settings.banner.description")}
      >
        <MediaUpload
          value={me?.bannerUrl ?? null}
          onChange={(url) => void onSavePatch({ bannerUrl: url })}
          aspectClassName="aspect-video"
          allowUrlInput={false}
        />
      </FormRow>

      <FormRow
        label={t("shell.settings.pseudonym.label")}
        description={t("shell.settings.pseudonym.description")}
        htmlFor="s-pseudonym"
      >
        <Input
          id="s-pseudonym"
          maxLength={40}
          {...pseudonymField}
          onBlur={(event) => {
            void pseudonymField.onBlur(event)
            void savePseudonym()
          }}
        />
        {errors.pseudonym && (
          <p className="mt-1.5 text-xs text-destructive">
            {errors.pseudonym.message}
          </p>
        )}
      </FormRow>

      <FormRow
        stacked
        label={t("shell.settings.bio.label")}
        description={t("shell.settings.bio.description")}
        htmlFor="s-bio"
      >
        <Textarea
          id="s-bio"
          rows={3}
          maxLength={160}
          {...bioField}
          onBlur={(event) => {
            void bioField.onBlur(event)
            void saveBio()
          }}
        />
        {errors.bio && (
          <p className="mt-1.5 text-xs text-destructive">
            {errors.bio.message}
          </p>
        )}
      </FormRow>

      <FormRow
        label={t("shell.settings.country.label")}
        description={t("shell.settings.country.description")}
      >
        <Select
          items={countries}
          value={country}
          onValueChange={(value) => {
            const next = value ?? ""
            reset((prev) => ({ ...prev, country: next }))
            saveCountry(next)
          }}
        >
          <SelectTrigger
            className="w-full"
            aria-label={t("shell.settings.country.aria")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countries.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>
    </FormSection>
  )
}
