import type { Language } from '@joutio/client-domain/api-types'
import { useState } from 'react'
import { useT } from '@/lib/i18n'
import { useImageUpload } from '../hooks/use-image-upload'
import { Button, Field, ImagePicker, ListRow, MobileSheet, RadioGroup, Segmented, tokens, type CategoryCode } from '@/ui'

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
