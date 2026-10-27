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
      {icon}
      <div className="text-base font-semibold">{title}</div>
      {description && (
        <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </Card>
  )
}
