import type { Language } from '@joutio/client/api-types'
import { zodResolver } from '@hookform/resolvers/zod'
import { topicDescriptionsSchema, topicNamesSchema, topicTitlesSchema } from '@joutio/client/forms'
import { useState } from 'react'
import { Controller, useForm, useFormState, useWatch } from 'react-hook-form'
import { useT } from '@/lib/i18n'
import { useImageUpload } from '../hooks/use-image-upload'
import {
  MASTERY_TIER_LABELS,
  MASTERY_TIERS,
  normalizeTitles,
  TITLE_MAX_LENGTH,
  titleLabel,
  titlesChanged,
  titlesDraft,
  type TitleLanguage,
  type TopicTitles,
  MAX_DESCRIPTION,
  MAX_NAME,
} from '@joutio/client/authoring'
import { formatNumber, MASTERY_XP } from '@/features/topic'
import { Badge, Button, Field, ImagePicker, ListRow, MobileSheet, RadioGroup, Segmented, tokens, type CategoryCode } from '@/ui'

const UNIVERSES = Object.keys(tokens.category) as CategoryCode[]

/** Univers d'un sujet : feuille à 17 choix, appliquée au choix. */
export function UniverseSheet({ open, value, onClose, onChange }: { open: boolean; value: string; onClose: () => void; onChange: (category: CategoryCode) => void }) {
  const t = useT()
  return (
    <MobileSheet open={open} onClose={onClose} title={t('workshop.universe')} tall>
      <RadioGroup label={t('workshop.universe')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
        {UNIVERSES.map((option, index) => (
          <ListRow
            key={option}
            label={tokens.category[option].label}
            control="radio"
            on={value === option}
            onToggle={() => {
              onChange(option)
              onClose()
            }}
            last={index === UNIVERSES.length - 1}
          />
        ))}
      </RadioGroup>
    </MobileSheet>
  )
}

export type Localized = Record<Language, string>

/**
 * Nom du sujet dans sa feuille (`creation.md` § 2) : onglets Français / English, et dessous le champ de la langue
 * choisie. Le français est obligatoire ; en anglais, l'aide rappelle le texte français. L'appelant change la clé à
 * chaque ouverture pour repartir des valeurs enregistrées.
 */
export function LocalizedFieldSheet({ open, title, label, initial, placeholder, saving, onClose, onSave }: {
  open: boolean
  title: string
  label: string
  initial: Localized
  placeholder: Localized
  saving?: boolean
  onClose: () => void
  onSave: (value: Localized) => void
}) {
  const t = useT()
  const [language, setLanguage] = useState<Language>('fr')
  const form = useForm({ resolver: zodResolver(topicNamesSchema), mode: 'onChange', defaultValues: initial })
  const french = useWatch({ control: form.control, name: 'fr' })
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <Button full loading={saving} disabled={!form.formState.isValid} onClick={() => void form.handleSubmit(onSave)()}>
          {t('settings.save')}
        </Button>
      }
    >
      <div className="grid gap-4">
        <Segmented
          label={t('workshop.language')}
          options={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          value={language}
          onChange={setLanguage}
        />
        <Controller
          key={language}
          control={form.control}
          name={language}
          render={({ field }) => (
            <Field
              label={language === 'fr' ? label : t('workshop.inEnglish', { label })}
              placeholder={placeholder[language]}
              hint={language === 'en' ? t('workshop.englishHint', { text: french.trim() || '—' }) : undefined}
              value={field.value}
              maxLength={MAX_NAME}
              counter={`${field.value.length} / ${MAX_NAME}`}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </div>
    </MobileSheet>
  )
}

/** Description du sujet (2026-11-13) : une par langue comme le nom, facultative ; seules les langues modifiées partent. */
export function DescriptionSheet({ open, initial, saving, onClose, onSave }: {
  open: boolean
  initial: Localized
  saving?: boolean
  onClose: () => void
  onSave: (changes: { language: Language; description: string | null }[]) => void
}) {
  const t = useT()
  const [language, setLanguage] = useState<Language>('fr')
  const form = useForm({ resolver: zodResolver(topicDescriptionsSchema), mode: 'onChange', defaultValues: initial })
  const { isValid } = useFormState({ control: form.control })
  const draft = useWatch({ control: form.control })
  const changesOf = (values: Localized) =>
    (['fr', 'en'] as const)
      .filter((code) => values[code].trim() !== initial[code].trim())
      .map((code) => ({ language: code, description: values[code].trim() === '' ? null : values[code].trim() }))
  const changed = (['fr', 'en'] as const).some((code) => (draft[code] ?? '').trim() !== initial[code].trim())
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={t('workshop.description')}
      subtitle={t('workshop.descriptionSub')}
      footer={
        <Button full loading={saving} disabled={!changed || !isValid} onClick={() => void form.handleSubmit((values) => onSave(changesOf(values)))()}>
          {t('settings.save')}
        </Button>
      }
    >
      <div className="grid gap-4">
        <Segmented
          label={t('workshop.language')}
          options={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          value={language}
          onChange={setLanguage}
        />
        <Controller
          key={language}
          control={form.control}
          name={language}
          render={({ field }) => (
            <Field
              label={language === 'fr' ? t('workshop.description') : t('workshop.inEnglish', { label: t('workshop.description') })}
              placeholder={language === 'fr' ? t('workshop.descriptionPlaceholder') : 'What players will find in this topic'}
              hint={language === 'en' ? t('workshop.englishHint', { text: (draft.fr ?? '').trim() || '—' }) : undefined}
              multiline
              value={field.value}
              maxLength={MAX_DESCRIPTION}
              counter={`${field.value.length} / ${MAX_DESCRIPTION}`}
              onChange={(event) => field.onChange(event.target.value)}
            />
          )}
        />
      </div>
    </MobileSheet>
  )
}

/** Vignette ou pictogramme du sujet : l'image s'applique dès l'envoi, la corbeille la retire. */
export function TopicImageSheet({ open, title, subtitle, hint, image, png = false, onClose, onChange }: {
  open: boolean
  title: string
  subtitle: string
  hint: string
  image: string | null | undefined
  png?: boolean
  onClose: () => void
  onChange: (url: string | null) => void
}) {
  const { progress, progressHint, pick, field } = useImageUpload(onChange, png)
  return (
    <MobileSheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <ImagePicker image={image ?? undefined} hint={progressHint ?? hint} progress={progress} onPick={pick} onRemove={() => onChange(null)} />
      {field}
    </MobileSheet>
  )
}

/**
 * Titres par palier (`creation.md` § 1, Titres, 2026-11-13) : le créateur nomme librement chacun des 7 paliers, en
 * français et en anglais. Un champ vide garde le repli « Or · Sujet », affiché en indication. Un seul Enregistrer.
 * Monter avec une `key` à chaque ouverture : le brouillon repart des titres enregistrés.
 */
export function TopicTitlesSheet({ open, topicName, titles, saving, onClose, onSave }: {
  open: boolean
  topicName: string
  titles: TopicTitles | null
  saving?: boolean
  onClose: () => void
  onSave: (titles: TopicTitles | null) => void
}) {
  const t = useT()
  const [language, setLanguage] = useState<TitleLanguage>('fr')
  const [initial] = useState(() => titlesDraft(titles))
  const form = useForm({ resolver: zodResolver(topicTitlesSchema), mode: 'onChange', defaultValues: initial })
  const [french, englishTitles] = useWatch({ control: form.control, name: ['fr', 'en'] })
  const draft = { fr: french, en: englishTitles }
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={t('workshop.titles')}
      subtitle={topicName}
      tall
      footer={
        <Button full loading={saving} disabled={!form.formState.isValid || !titlesChanged(titles, draft)} onClick={() => void form.handleSubmit((values) => onSave(normalizeTitles(values)))()}>
          {t('settings.save')}
        </Button>
      }
    >
      <div className="grid gap-4">
        <p className="jo-type-callout m-0 text-pretty text-jo-muted">{t('workshop.titlesText', { topic: topicName })}</p>
        <Segmented
          label={t('workshop.language')}
          options={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
          value={language}
          onChange={setLanguage}
        />
        {MASTERY_TIERS.map((tier) => {
          return (
            <div key={`${language}-${tier}`} className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="tier" tier={tier}>
                  {MASTERY_TIER_LABELS[tier]}
                </Badge>
                <span className="jo-type-caption text-jo-muted">{`${formatNumber(MASTERY_XP[tier])} XP`}</span>
              </div>
              <Controller
                control={form.control}
                name={`${language}.${tier}`}
                render={({ field }) => (
                  <Field
                    label={language === 'fr' ? t('workshop.titleLabel', { tier: MASTERY_TIER_LABELS[tier] }) : t('workshop.inEnglish', { label: t('workshop.titleLabel', { tier: MASTERY_TIER_LABELS[tier] }) })}
                    placeholder={language === 'en' ? titleLabel(normalizeTitles(draft), tier, topicName, 'fr') : `${MASTERY_TIER_LABELS[tier]} · ${topicName}`}
                    value={field.value}
                    maxLength={TITLE_MAX_LENGTH}
                    counter={`${field.value.length} / ${TITLE_MAX_LENGTH}`}
                    onChange={(event) => field.onChange(event.target.value)}
                  />
                )}
              />
            </div>
          )
        })}
      </div>
    </MobileSheet>
  )
}
