import type { ReactNode } from "react"
import { cn } from "cn"
import { Card } from "@/components/ui/card"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

/**
 * État vide standard (carte centrée) : icône, titre, description lisible (largeur de
 * lecture bornée), action optionnelle. Évite les copies `py-12 text-center` éparpillées.
 */
export function EmptyState({
  icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn("items-center gap-3 px-5 py-12 text-center", className)}
    >
      {icon && (
        <span className="grid size-18 place-items-center rounded-xl bg-raised text-primary [&_svg]:size-9">
          {icon}
        </span>
      )}
      <div className="type-title-1 text-balance">{title}</div>
      {description && (
        <p className="max-w-[300px] text-base text-pretty text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </Card>
  )
}
