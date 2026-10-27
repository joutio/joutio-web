import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"

export interface FacetOption {
  value: string
  label: string
  count?: number
  color?: string
}

interface FacetOptionListProps {
  options: FacetOption[]
  /** Valeur sélectionnée (`null` = toutes). */
  value: string | null
  onChange: (value: string | null) => void
}

/**
 * Liste à coche unique d'un filtre à facettes — partagée par le popover desktop
 * (`FacetCombobox`) et le drawer mobile.
 */
export function FacetOptionList({
  options,
  value,
  onChange,
}: FacetOptionListProps) {
  const { t } = useTranslation()
  return (
    <>
      <button
        type="button"
        onClick={() => onChange(null)}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
      >
        <span className="flex-1">{t("topics.filters.all")}</span>
        {value === null && <Check className="size-4" />}
      </button>

      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(selected ? null : option.value)}
            className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: option.color }}
            />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            {option.count != null && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {option.count}
              </span>
            )}
            {selected && <Check className="size-4 shrink-0" />}
          </button>
        )
      })}

      {options.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {t("topics.filters.noResult")}
        </div>
      )}
    </>
  )
}
