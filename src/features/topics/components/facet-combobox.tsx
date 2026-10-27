import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown } from "lucide-react"
import { cn } from "cn"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FacetOptionList, type FacetOption } from "./facet-option-list"

interface FacetComboboxProps {
  /** Libellé du filtre (ex. « Catégorie »). */
  label: string
  options: FacetOption[]
  /** Catégorie sélectionnée (`null` = toutes). */
  value: string | null
  onChange: (value: string | null) => void
  className?: string
}

/**
 * Filtre à facettes en combobox : pilule `Label · <sélection>` + popover avec item
 * « Toutes » et liste à coche unique. Client-side (petite liste locale).
 */
export function FacetCombobox({
  label,
  options,
  value,
  onChange,
  className,
}: FacetComboboxProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const summary =
    value === null
      ? t("topics.filters.all")
      : (options.find((option) => option.value === value)?.label ?? "1")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("topics.filters.by", { label: label.toLowerCase() })}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-3xl border border-border bg-background px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 aria-expanded:bg-muted",
          className
        )}
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="text-border">|</span>
        <span className="max-w-[140px] truncate">{summary}</span>
        <ChevronDown className="size-4 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(300px,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <div className="max-h-[320px] overflow-y-auto overscroll-y-contain p-1.5">
          <FacetOptionList
            options={options}
            value={value}
            onChange={onChange}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
