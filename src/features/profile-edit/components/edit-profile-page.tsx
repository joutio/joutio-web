import { countryFlag, countryName } from '@joutio/client-domain/geo'
import { CameraIcon, GlobeHemisphereWestIcon, PencilSimpleIcon, TrashIcon, WarningIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { MAX_BIO, MAX_PSEUDONYM, pseudonymError, pseudonymHint, usePseudonymCheck, useUpdateMe } from '@/features/settings'
import { isApiError } from '@/lib/api'
import { useLanguageStore, useT } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { CountryPicker } from '@/shared/country-picker'
import { showDialog } from '@/shared/dialog'
import { isAcceptedImage, uploadImage } from '@/shared/media'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { Avatar, Button, Field, IconButton, ListRow, MobileTopBar, Screen } from '@/ui'

interface Draft {
  pseudonym: string
  bio: string
  country: string | null
  bannerUrl: string | null
}

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
  const initial: Draft = { pseudonym: me?.pseudonym ?? '', bio: me?.bio ?? '', country: me?.country ?? null, bannerUrl: me?.bannerUrl ?? null }
  const [draft, setDraft] = useState<Draft>(initial)
  const [countryOpen, setCountryOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
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
    setUploading(true)
    try {
      const url = (await uploadImage(picked)).url
      setDraft((current) => ({ ...current, bannerUrl: url }))
    } catch (error) {
      toast.error(t('settings.imageError'), (isApiError(error) && error.detail) || t('settings.imageRule'))
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      if (changed.pseudonym) await savePseudonym.mutateAsync(draft.pseudonym.trim())
      if (changed.bio) await saveBio.mutateAsync(draft.bio.trim() || null)
      if (changed.country) await saveCountry.mutateAsync(draft.country)
      if (changed.bannerUrl) await saveBanner.mutateAsync(draft.bannerUrl)
      toast.success(t('editProfile.saved'))
      close()
    } catch {
      // Chaque mutation affiche sa propre erreur ; la page reste ouverte avec le brouillon.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen
      header={
        <MobileTopBar
          variant="modal"
          title={t('editProfile.title')}
          cancel={t('common.cancel')}
          confirm={t('settings.save')}
          confirmDisabled={!dirty || !pseudonymOk || uploading || saving}
          onCancel={close}
          onConfirm={() => void save()}
        />
      }
      overlay={<CountryPicker open={countryOpen} onClose={() => setCountryOpen(false)} value={draft.country} onChange={(country) => setDraft({ ...draft, country })} />}
    >
      <div className="grid gap-6 pb-8">
        <div>
          <div className="relative h-36 overflow-hidden bg-jo-raised">
            {draft.bannerUrl && <img src={draft.bannerUrl} alt="" className="size-full object-cover" />}
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30">
              <IconButton icon={CameraIcon} label={t(draft.bannerUrl ? 'editProfile.changeBanner' : 'editProfile.addBanner')} media disabled={uploading} onClick={() => file.current?.click()} />
              {draft.bannerUrl && <IconButton icon={TrashIcon} label={t('editProfile.removeBanner')} media onClick={() => setDraft({ ...draft, bannerUrl: null })} />}
            </div>
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
          <div className="-mt-10 flex items-end justify-between gap-3 px-4">
            <span className="rounded-full ring-4 ring-jo-bg">
              <Avatar name={draft.pseudonym} src={src} size="xl" />
            </span>
            <Button variant="tinted" size="S" icon={PencilSimpleIcon} onClick={() => void navigate(ROUTES.avatar)}>
              {t('editProfile.editAvatar')}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 px-4">
          <Field
            label={t('settings.pseudonym')}
            value={draft.pseudonym}
            maxLength={MAX_PSEUDONYM}
            counter={`${draft.pseudonym.length} / ${MAX_PSEUDONYM}`}
            hint={check.state === 'unchanged' ? t('settings.pseudonymHint') : pseudonymHint(check, t)}
            error={pseudonymError(check, t)}
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="nickname"
            onChange={(event) => setDraft({ ...draft, pseudonym: event.target.value })}
          />
          <Field
            label={t('settings.bio')}
            placeholder={t('settings.bioPlaceholder')}
            multiline
            value={draft.bio}
            maxLength={MAX_BIO}
            counter={`${draft.bio.length} / ${MAX_BIO}`}
            onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
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
