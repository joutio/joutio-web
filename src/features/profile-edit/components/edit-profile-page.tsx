import { zodResolver } from '@hookform/resolvers/zod'
import { MAX_BIO, profileSchema } from '@joutio/client/forms'
import { countryFlag, countryName } from '@joutio/client/geo'
import { MAX_PSEUDONYM } from '@joutio/client/profile'
import { CameraIcon, GlobeHemisphereWestIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { pseudonymError, pseudonymHint, usePseudonymCheck, useUpdateMe } from '@/features/settings'
import { isApiError } from '@/lib/api'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { CountryPicker } from '@/shared/country-picker'
import { showDialog } from '@/shared/dialog'
import { isAcceptedImage, uploadImage, withImageRights } from '@/shared/media'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { Avatar, Field, IconButton, ListRow, MobileTopBar, ProgressBar, Screen } from '@/ui'

/** Profil et bannière : la bannière est une URL déjà envoyée, sans règle de saisie. */
const schema = profileSchema.extend({ bannerUrl: z.string().nullable() })

/**
 * Éditer le profil (`design/specs/screens/editer-profil.md`, lab `/screens/profil?variant=edit`) : page plein écran
 * ouverte par le bouton du Profil. Bannière, avatar (éditeur existant), pseudonyme vérifié en direct, bio et pays ;
 * un seul « Enregistrer » envoie les seuls champs modifiés, dans l'ordre. Quitter avec des modifications demande
 * confirmation. La date de naissance est dans Réglages › Compte.
 */
export function EditProfilePage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const me = useMe().data
  const src = useUserAvatar(me)
  const initial = { pseudonym: me?.pseudonym ?? '', bio: me?.bio ?? '', country: me?.country ?? null, bannerUrl: me?.bannerUrl ?? null }
  const form = useForm({ resolver: zodResolver(schema), mode: 'onChange', defaultValues: initial })
  const draft = { ...initial, ...useWatch({ control: form.control }) }
  const setCountry = (country: string | null) => form.setValue('country', country, { shouldValidate: true })
  const setBanner = (url: string | null) => form.setValue('bannerUrl', url, { shouldValidate: true })
  const [countryOpen, setCountryOpen] = useState(false)
  // Avancement de l'envoi de la bannière (0 à 100) ; `undefined` hors envoi.
  const [progress, setProgress] = useState<number | undefined>(undefined)
  const uploading = progress !== undefined
  const [saving, setSaving] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const savePseudonym = useUpdateMe('pseudonym')
  const saveBio = useUpdateMe('bio')
  const saveCountry = useUpdateMe('country')
  const saveBanner = useUpdateMe('bannerUrl')
  const check = usePseudonymCheck(draft.pseudonym, me?.pseudonym)
  const changed = {
    pseudonym: draft.pseudonym.trim() !== initial.pseudonym,
    bio: draft.bio.trim() !== initial.bio,
    country: draft.country !== initial.country,
    bannerUrl: draft.bannerUrl !== initial.bannerUrl,
  }
  const dirty = Object.values(changed).some(Boolean)
  const pseudonymOk = !changed.pseudonym || check.state === 'available'

  // Fermeture du navigateur ou retour arrière avec des modifications : confirmation.
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname && nextLocation.pathname !== ROUTES.avatar)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    showDialog({
      sheet: true,
      icon: WarningIcon,
      title: t('editProfile.discardTitle'),
      message: t('editProfile.discardText'),
      actions: [
        { label: t('editProfile.discard'), variant: 'tinted', tone: 'destructive', onClick: () => blocker.proceed() },
        { label: t('editProfile.keepEditing'), variant: 'plain', tone: 'neutral', onClick: () => blocker.reset() },
      ],
    })
  }, [blocker, t])

  const close = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.me, { replace: true }))

  const upload = async (picked: File | undefined) => {
    if (!picked) return
    if (!isAcceptedImage(picked)) {
      toast.error(t('settings.imageError'), t('settings.imageRule'))
      return
    }
    setProgress(0)
    try {
      const url = (await uploadImage(picked, setProgress)).url
      setBanner(url)
    } catch (error) {
      toast.error(t('settings.imageError'), (isApiError(error) && error.detail) || t('settings.imageRule'))
    } finally {
      setProgress(undefined)
    }
  }

  const save = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      if (changed.pseudonym) await savePseudonym.mutateAsync(values.pseudonym)
      if (changed.bio) await saveBio.mutateAsync(values.bio || null)
      if (changed.country) await saveCountry.mutateAsync(values.country)
      if (changed.bannerUrl) await saveBanner.mutateAsync(values.bannerUrl)
      toast.success(t('editProfile.saved'))
      close()
    } catch {
      // Chaque mutation affiche sa propre erreur ; la page reste ouverte avec le brouillon.
    } finally {
      setSaving(false)
    }
  })

  return (
    <Screen
      header={
        <MobileTopBar
          variant="modal"
          title={t('editProfile.title')}
          cancel={t('common.cancel')}
          confirm={t('settings.save')}
          confirmDisabled={!dirty || !pseudonymOk || !form.formState.isValid || uploading || saving}
          onCancel={close}
          onConfirm={() => void save()}
        />
      }
      overlay={<CountryPicker open={countryOpen} onClose={() => setCountryOpen(false)} value={draft.country} onChange={(country) => setCountry(country)} />}
    >
      <div className="grid gap-6 pb-8">
        <div>
          <div className="relative h-36 overflow-hidden bg-jo-raised">
            {draft.bannerUrl && <img src={draft.bannerUrl} alt="" className="size-full object-cover" />}
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30">
              <IconButton icon={CameraIcon} label={t(draft.bannerUrl ? 'editProfile.changeBanner' : 'editProfile.addBanner')} media disabled={uploading} onClick={() => withImageRights(() => file.current?.click())} />
              {draft.bannerUrl && <IconButton icon={TrashIcon} label={t('editProfile.removeBanner')} media disabled={uploading} onClick={() => setBanner(null)} />}
            </div>
            {uploading && (
              <div className="absolute inset-x-2 bottom-2 grid gap-1 rounded-jo-sm bg-jo-surface/90 px-3 py-2 text-jo-text">
                <span className="jo-type-caption">{t('media.uploadingPercent', { percent: progress })}</span>
                <ProgressBar value={progress} ariaLabel={t('media.uploadingPercent', { percent: progress })} />
              </div>
            )}
            <input
              ref={file}
              type="file"
              accept="image/jpeg,image/png"
              hidden
              onChange={(event) => {
                void upload(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </div>
        <div className="mx-4 overflow-hidden rounded-jo-lg bg-jo-surface">
          <ListRow leading={<Avatar name={draft.pseudonym} src={src} size="md" decorative />} label={t('editProfile.editAvatar')} control="chevron" onClick={() => void navigate(ROUTES.avatar)} last />
        </div>
        <div className="grid gap-4 px-4">
          <Controller
            control={form.control}
            name="pseudonym"
            render={({ field }) => (
              <Field
                label={t('settings.pseudonym')}
                value={field.value}
                maxLength={MAX_PSEUDONYM}
                counter={`${field.value.length} / ${MAX_PSEUDONYM}`}
                hint={check.state === 'unchanged' ? t('settings.pseudonymHint') : pseudonymHint(check, t)}
                error={pseudonymError(check, t)}
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="nickname"
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
          <Controller
            control={form.control}
            name="bio"
            render={({ field }) => (
              <Field
                label={t('settings.bio')}
                placeholder={t('settings.bioPlaceholder')}
                multiline
                value={field.value}
                maxLength={MAX_BIO}
                counter={`${field.value.length} / ${MAX_BIO}`}
                onChange={(event) => field.onChange(event.target.value)}
              />
            )}
          />
        </div>
        <div className="mx-4 overflow-hidden rounded-jo-lg bg-jo-surface">
          <ListRow
            icon={GlobeHemisphereWestIcon}
            label={t('settings.country')}
            value={draft.country ? `${countryFlag(draft.country)} ${countryName(draft.country, language)}` : t('country.hidden')}
            control="chevron"
            onClick={() => setCountryOpen(true)}
            last
          />
        </div>
      </div>
    </Screen>
  )
}
