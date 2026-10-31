import { MagnifyingGlassIcon, XCircleIcon } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { cn } from "cn"
import { Input } from "@/components/ui/input"

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
  /** Id du champ, pour associer un libellé externe. */
  id?: string
}

/**
 * Champ de recherche Jo Field (design system 3.0) : **44 px, pilule**, surface `raised`,
 * icône 18 px et effacement intégré. Il remplace le champ de texte standard dans les barres
 * de filtres — un champ de saisie classique garde sa hauteur de 48 px.
 */
export function SearchField({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
  id,
}: SearchFieldProps) {
  const { t } = useTranslation()

  return (
    <div className={cn("relative w-full", className)}>
      <MagnifyingGlassIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground"
      />
      <Input
        id={id}
        type="text"
        size="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // Entrée replie le clavier mobile : la recherche est déjà live.
          if (event.key === "Enter") event.currentTarget.blur()
        }}
        enterKeyHint="search"
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="bg-raised pr-10 pl-11 text-base"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("shared.searchToolbar.clearSearch")}
          className="absolute top-1/2 right-2.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <XCircleIcon className="size-[18px]" weight="fill" aria-hidden />
        </button>
      )}
    </div>
  )
}
