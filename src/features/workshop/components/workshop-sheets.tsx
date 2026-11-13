import type { Language } from '@joutio/client-domain/api-types'
import { useState } from 'react'
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
  tooLongTitle,
  type TitleLanguage,
  type TopicTitles,
} from '@joutio/client-domain/authoring'
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
 * Champ traduisible dans sa feuille (`creation.md` § 2) : onglets Français / English, et dessous le champ de la langue
 * choisie. Le français est obligatoire ; en anglais, l'aide rappelle le texte français. L'appelant change la clé à
 * chaque ouverture pour repartir des valeurs enregistrées.
 */
export function LocalizedFieldSheet({ open, title, label, initial, max, placeholder, saving, onClose, onSave }: {
  open: boolean
  title: string
  label: string
  initial: Localized
  max: number
  placeholder: Localized
  saving?: boolean
  onClose: () => void
  onSave: (value: Localized) => void
}) {
  const t = useT()
  const [language, setLanguage] = useState<Language>('fr')
  const [draft, setDraft] = useState<Localized>(initial)
  const value = draft[language]
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <Button full loading={saving} disabled={draft.fr.trim() === ''} onClick={() => onSave({ fr: draft.fr.trim(), en: draft.en.trim() })}>
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
        <Field
          key={language}
          label={language === 'fr' ? label : t('workshop.inEnglish', { label })}
          placeholder={placeholder[language]}
          hint={language === 'en' ? t('workshop.englishHint', { text: draft.fr.trim() || '—' }) : undefined}
          value={value}
          maxLength={max}
          counter={`${value.length} / ${max}`}
          onChange={(event) => setDraft({ ...draft, [language]: event.target.value })}
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
  const t = useT()
  const { uploading, pick, field } = useImageUpload(onChange, png)
  return (
    <MobileSheet open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <ImagePicker image={image ?? undefined} hint={uploading ? t('settings.uploading') : hint} onPick={pick} onRemove={() => onChange(null)} />
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
  const [draft, setDraft] = useState(() => titlesDraft(titles))
  const invalid = tooLongTitle(draft) !== null
  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title={t('workshop.titles')}
      subtitle={topicName}
      tall
      footer={
        <Button full loading={saving} disabled={invalid || !titlesChanged(titles, draft)} onClick={() => onSave(normalizeTitles(draft))}>
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
          const value = draft[language][tier]
          return (
            <div key={`${language}-${tier}`} className="grid gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="tier" tier={tier}>
                  {MASTERY_TIER_LABELS[tier]}
                </Badge>
                <span className="jo-type-caption text-jo-muted">{`${formatNumber(MASTERY_XP[tier])} XP`}</span>
              </div>
              <Field
                label={language === 'fr' ? t('workshop.titleLabel', { tier: MASTERY_TIER_LABELS[tier] }) : t('workshop.inEnglish', { label: t('workshop.titleLabel', { tier: MASTERY_TIER_LABELS[tier] }) })}
                placeholder={language === 'en' ? titleLabel(normalizeTitles(draft), tier, topicName, 'fr') : `${MASTERY_TIER_LABELS[tier]} · ${topicName}`}
                value={value}
                maxLength={TITLE_MAX_LENGTH}
                counter={`${value.length} / ${TITLE_MAX_LENGTH}`}
                onChange={(event) => setDraft({ ...draft, [language]: { ...draft[language], [tier]: event.target.value } })}
              />
            </div>
          )
        })}
      </div>
    </MobileSheet>
  )
}
