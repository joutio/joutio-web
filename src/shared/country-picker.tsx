import { countryFlag, countryName, searchCountries, suggestedCountries, regionOfLocale } from '@joutio/client-domain/geo'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { useLanguageStore, useT } from '@/lib/i18n'
import { EmptyState, ListRow, MobileSheet, RadioGroup, SearchField, SectionHeader } from '@/ui'

const GROUP = 'overflow-hidden rounded-jo-lg bg-jo-raised'

export interface CountryPickerProps {
  open: boolean
  onClose: () => void
  /** Code ISO 3166-1 alpha-2, `null` si le pays n'est pas affiché. */
  value: string | null
  onChange: (code: string | null) => void
}

/**
 * Sélecteur de pays (`editer-profil.md` § 4, lab `country-picker.tsx`) : recherche sans accents (nom ou code), pays
 * suggérés (appareil puis pays les plus joués) et « Ne pas afficher », puis les 249 pays ISO triés par nom.
 */
export function CountryPicker({ open, onClose, value, onChange }: CountryPickerProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const [query, setQuery] = useState('')
  const results = searchCountries(query, language)
  const suggested = suggestedCountries(regionOfLocale(navigator.language))
  const pick = (code: string | null) => {
    onChange(code)
    setQuery('')
    onClose()
  }
  const row = (code: string, last: boolean) => (
    <ListRow
      key={code}
      leading={<span className="jo-type-title-2">{countryFlag(code)}</span>}
      label={countryName(code, language)}
      control="radio"
      on={value === code}
      onToggle={() => pick(code)}
      last={last}
    />
  )

  return (
    <MobileSheet open={open} onClose={onClose} title={t('settings.country')} tall>
      <div className="grid gap-4">
        <div className="sticky top-0 z-10 bg-jo-surface pb-1">
          <SearchField value={query} onChange={setQuery} placeholder={t('settings.countrySearch')} label={t('settings.countrySearch')} />
        </div>
        {query.trim() === '' && (
          <>
            <section className="grid gap-2">
              <SectionHeader title={t('country.suggested')} level={3} />
              <RadioGroup label={t('country.suggested')} className={GROUP}>
                {suggested.map((code) => row(code, false))}
                <ListRow label={t('country.hidden')} sub={t('country.hiddenSub')} control="radio" on={value === null} onToggle={() => pick(null)} last />
              </RadioGroup>
            </section>
            <SectionHeader title={t('country.all')} level={3} />
          </>
        )}
        {results.length > 0 ? (
          <RadioGroup label={t('settings.country')} className={GROUP}>
            {results.map(({ code }, index) => row(code, index === results.length - 1))}
          </RadioGroup>
        ) : (
          <EmptyState icon={MagnifyingGlassIcon} title={t('settings.noCountry')} description={t('country.noResultText')} />
        )}
      </div>
    </MobileSheet>
  )
}
