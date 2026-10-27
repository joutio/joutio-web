import { Fragment } from "react"
import {
  Breadcrumb as BreadcrumbUI,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export interface Crumb {
  label: string
  onClick?: () => void
}

interface BreadcrumbProps {
  items: Crumb[]
  isMobile?: boolean
}

/**
 * Fil d'Ariane de la topbar — shadcn natif. Chaque cran intermédiaire est cliquable,
 * le dernier est la page courante. Sur mobile, seul le cran courant est affiché.
 */
export function Breadcrumb({ items, isMobile }: BreadcrumbProps) {
  const shown = isMobile ? items.slice(-1) : items
  return (
    <BreadcrumbUI>
      <BreadcrumbList className="flex-nowrap">
        {shown.map((crumb, index) => {
          const last = index === shown.length - 1
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem className="min-w-0">
                {last || !crumb.onClick ? (
                  <BreadcrumbPage
                    className={
                      "truncate font-heading " +
                      (last ? "text-base font-bold" : "text-sm font-semibold")
                    }
                  >
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<button type="button" onClick={crumb.onClick} />}
                    className="truncate font-heading text-sm font-semibold"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </BreadcrumbUI>
  )
}
