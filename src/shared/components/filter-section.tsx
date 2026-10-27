import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "cn"
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface FilterSectionsProps {
  /** `value` de la seule section ouverte au montage (aucune si absent). */
  defaultOpen?: string
  children: ReactNode
}

/**
 * Groupe de sections de filtres en accordéon à **ouverture unique** : déplier une section
 * replie automatiquement les autres.
 */
export function FilterSections({ defaultOpen, children }: FilterSectionsProps) {
  return (
    <Accordion multiple={false} defaultValue={defaultOpen ? [defaultOpen] : []}>
      {children}
    </Accordion>
  )
}

interface FilterSectionProps {
  /** Identifiant unique de la section dans le `FilterSections` parent. */
  value: string
  title: string
  description?: string
  /** Valeur courante affichée sous le titre (reste lisible section repliée). */
  summary?: string
  children: ReactNode
}

/** Section de drawer de filtres repliable (item d'un `FilterSections`). */
export function FilterSection({
  value,
  title,
  description,
  summary,
  children,
}: FilterSectionProps) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>
        <span className="flex min-w-0 flex-col">
          <span className="font-heading text-sm font-semibold">{title}</span>
          {(summary || description) && (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {summary ?? description}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionPanel>
        <div className="flex flex-col gap-1 pt-1 pb-2">{children}</div>
      </AccordionPanel>
    </AccordionItem>
  )
}

interface FilterOptionProps {
  selected: boolean
  onSelect: () => void
  children: ReactNode
}

/** Option unique d'un drawer de filtres (ligne pleine largeur, cible 44 px). */
export function FilterOption({
  selected,
  onSelect,
  children,
}: FilterOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors",
        selected ? "bg-primary/10 text-primary" : "hover:bg-accent"
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
        {children}
      </span>
      {selected && <Check className="size-4 shrink-0" />}
    </button>
  )
}
