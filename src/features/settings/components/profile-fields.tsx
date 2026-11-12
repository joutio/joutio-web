import type { MeView } from '@joutio/client-domain/api-types'
import { GlobeHemisphereWestIcon, ImageIcon, MagnifyingGlassIcon, QuotesIcon, SparkleIcon, UserIcon } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { isApiError } from '@/lib/api'
import { useUserAvatar } from '@/shared/avatar'
import { COUNTRY_CODES, countryFlag, countryLabel } from '@/shared/country'
import { ROUTES } from '@/shared/routes'
import { toast } from '@/shared/toast'
import { Avatar, Button, CategoryTile, EmptyState, Field, ImagePicker, ListRow, MobileSheet, RadioGroup, SearchField, tokens, type CategoryCode } from '@/ui'
import { useUpdateMe } from '../hooks/use-settings'
import { MAX_BIO, MAX_INTERESTS, MAX_PSEUDONYM, settingsService } from '../lib/settings-service'

type FieldId = 'pseudonym' | 'bio' | 'country' | 'interests' | 'banner'

const UNIVERSES = Object.keys(tokens.category) as CategoryCode[]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/**
 * Lignes « Profil » des Réglages et leurs feuilles (`reglages.md` § 1, lab `profile-fields.tsx`) : Avatar en tête, puis
 * Pseudonyme, Bio, Pays, Centres d'intérêt, Bannière. Le pays s'applique au choix, le reste par Enregistrer. Les
 * feuilles se rendent hors du défilement.
 */
export function useProfileFields(me: MeView | undefined) {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const avatar = useUserAvatar(me)
  const [field, setField] = useState<FieldId>()
  const [pseudonym, setPseudonym] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [banner, setBanner] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [query, setQuery] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const savePseudonym = useUpdateMe('pseudonym')
  const saveBio = useUpdateMe('bio')
  const saveCountry = useUpdateMe('country')
  const saveInterests = useUpdateMe('interests')
  const saveBanner = useUpdateMe('bannerUrl')

  const open = (next: FieldId) => {
    setPseudonym(me?.pseudonym ?? '')
    setBio(me?.bio ?? '')
    setInterests(me?.interests ?? [])
    setBanner(me?.bannerUrl ?? null)
    setQuery('')
    setField(next)
  }
  const close = () => setField(undefined)

  const upload = async (picked: File | undefined) => {
    if (!picked) return
    if (!['image/jpeg', 'image/png'].includes(picked.type) || picked.size > MAX_IMAGE_BYTES) {
      toast.error(t('settings.imageError'), t('settings.imageRule'))
      return
    }
    setUploading(true)
    try {
      setBanner((await settingsService.upload(picked)).url)
    } catch (error) {
      toast.error(t('settings.imageError'), (isApiError(error) && error.detail) || t('settings.imageRule'))
    } finally {
      setUploading(false)
    }
  }

  const search = query.trim().toLowerCase()
  const countries = COUNTRY_CODES.map((code) => ({ code, name: countryLabel(code, language) }))
    .filter((country) => country.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name, language))
  const full = interests.length === MAX_INTERESTS
  const toggleInterest = (category: string) => setInterests(interests.includes(category) ? interests.filter((item) => item !== category) : [...interests, category])
  const country = me?.country

  const rows = (
    <>
      <ListRow leading={<Avatar name={me?.pseudonym ?? ''} src={avatar} size="sm" />} label={t('settings.avatar')} sub={t('settings.avatarSub')} control="chevron" onClick={() => void navigate(ROUTES.avatar)} />
      <ListRow icon={UserIcon} label={t('settings.pseudonym')} control="chevron" value={me?.pseudonym} onClick={() => open('pseudonym')} />
      <ListRow icon={QuotesIcon} label={t('settings.bio')} sub={me?.bio || t('settings.bioEmpty')} control="chevron" onClick={() => open('bio')} />
      <ListRow
        icon={GlobeHemisphereWestIcon}
        label={t('settings.country')}
        control="chevron"
        value={country ? `${countryFlag(country)} ${countryLabel(country, language)}` : t('settings.countryEmpty')}
        onClick={() => open('country')}
      />
      <ListRow
        icon={SparkleIcon}
        label={t('settings.interests')}
        sub={(me?.interests ?? []).map((category) => tokens.category[category as CategoryCode]?.label ?? category).join(', ') || t('settings.interestsEmpty')}
        control="chevron"
        onClick={() => open('interests')}
      />
      <ListRow icon={ImageIcon} label={t('settings.banner')} control="chevron" value={t(me?.bannerUrl ? 'settings.bannerEdit' : 'settings.bannerAdd')} onClick={() => open('banner')} last />
    </>
  )

  const saving = savePseudonym.isPending || saveBio.isPending || saveInterests.isPending || saveBanner.isPending
  const save = (disabled: boolean, run: () => Promise<unknown>) => (
    <Button full disabled={disabled} loading={saving} onClick={() => void run().then(close, () => undefined)}>
      {t('settings.save')}
    </Button>
  )

  const sheets = (
    <>
      <MobileSheet
        open={field === 'pseudonym'}
        onClose={close}
        title={t('settings.pseudonym')}
        footer={save(pseudonym.trim() === '' || pseudonym.trim() === me?.pseudonym, () => savePseudonym.mutateAsync(pseudonym.trim()))}
      >
        <Field
          label={t('settings.pseudonym')}
          value={pseudonym}
          maxLength={MAX_PSEUDONYM}
          counter={`${pseudonym.length} / ${MAX_PSEUDONYM}`}
          hint={t('settings.pseudonymHint')}
          autoComplete="nickname"
          onChange={(event) => setPseudonym(event.target.value)}
        />
      </MobileSheet>
      <MobileSheet open={field === 'bio'} onClose={close} title={t('settings.bio')} footer={save(bio === (me?.bio ?? ''), () => saveBio.mutateAsync(bio.trim() || null))}>
        <Field
          label={t('settings.bio')}
          placeholder={t('settings.bioPlaceholder')}
          multiline
          value={bio}
          maxLength={MAX_BIO}
          counter={`${bio.length} / ${MAX_BIO}`}
          onChange={(event) => setBio(event.target.value)}
        />
      </MobileSheet>
      <MobileSheet open={field === 'country'} onClose={close} title={t('settings.country')} tall>
        <div className="grid gap-3">
          <div className="sticky top-0 z-10 bg-jo-surface pb-1">
            <SearchField value={query} onChange={setQuery} placeholder={t('settings.countrySearch')} label={t('settings.countrySearch')} />
          </div>
          {countries.length > 0 ? (
            <RadioGroup label={t('settings.country')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
              {countries.map((item, index) => (
                <ListRow
                  key={item.code}
                  leading={<span className="jo-type-title-2">{countryFlag(item.code)}</span>}
                  label={item.name}
                  control="radio"
                  on={country === item.code}
                  disabled={saveCountry.isPending}
                  onToggle={() => saveCountry.mutate(item.code, { onSuccess: close })}
                  last={index === countries.length - 1}
                />
              ))}
            </RadioGroup>
          ) : (
            <EmptyState icon={MagnifyingGlassIcon} title={t('settings.noCountry')} description={t('settings.noCountryText')} />
          )}
        </div>
      </MobileSheet>
      <MobileSheet
        open={field === 'interests'}
        onClose={close}
        title={t('settings.interests')}
        subtitle={t('settings.interestsCount', { count: interests.length, max: MAX_INTERESTS })}
        tall
        footer={save(interests.join() === (me?.interests ?? []).join(), () => saveInterests.mutateAsync(interests))}
      >
        <div className="grid gap-3">
          <p className="jo-type-callout m-0 text-pretty text-jo-muted">{t('settings.interestsText')}</p>
          <div className="grid grid-cols-3 gap-2">
            {UNIVERSES.map((category) => {
              const on = interests.includes(category)
              return <CategoryTile key={category} category={category} selected={on} disabled={full && !on} onToggle={() => toggleInterest(category)} />
            })}
          </div>
        </div>
      </MobileSheet>
      <MobileSheet
        open={field === 'banner'}
        onClose={close}
        title={t('settings.banner')}
        footer={save(uploading || banner === (me?.bannerUrl ?? null), () => saveBanner.mutateAsync(banner))}
      >
        <ImagePicker image={banner ?? undefined} hint={t(uploading ? 'settings.uploading' : 'settings.bannerHint')} onPick={() => file.current?.click()} onRemove={() => setBanner(null)} />
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
      </MobileSheet>
    </>
  )

  return { rows, sheets }
}
