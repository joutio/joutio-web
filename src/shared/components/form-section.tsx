import type { ReactNode } from "react"
import { cn } from "cn"
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface FormSectionProps {
  title: string
  sub?: string
  children: ReactNode
}

/**
 * Section de formulaire en Card (disposition des Réglages) : en-tête de carte (titre +
 * sous-titre), puis des rangées séparées par des filets.
 */
export function FormSection({ title, sub, children }: FormSectionProps) {
  return (
    <Card className="mb-5">
      <CardHeader>
        <CardHeading>
          <h2 className="text-sm leading-tight font-medium">{title}</h2>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </CardHeading>
      </CardHeader>
      <CardContent className="pt-0 pb-2">{children}</CardContent>
    </Card>
  )
}

interface FormRowProps {
  label: string
  description?: string
  htmlFor?: string
  /** Contrôle pleine largeur sous le libellé (zone de texte, aperçu…). */
  stacked?: boolean
  controlClassName?: string
  children: ReactNode
}

/**
 * Rangée de formulaire : libellé + description à gauche, contrôle à droite (colonne 360 px,
 * empilée en mobile). `stacked` place le contrôle en pleine largeur sous le libellé.
 */
export function FormRow({
  label,
  description,
  htmlFor,
  stacked,
  controlClassName,
  children,
}: FormRowProps) {
  if (stacked) {
    return (
      <div className="border-b py-4 last:border-b-0">
        <Label htmlFor={htmlFor} className="text-sm font-normal">
          {label}
        </Label>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
        <div className={cn("mt-3", controlClassName)}>{children}</div>
      </div>
    )
  }

  return (
    <div className="grid gap-2 border-b py-4 last:border-b-0 tablet-up:grid-cols-[minmax(0,1fr)_minmax(0,360px)] tablet-up:items-center tablet-up:gap-6">
      <div className="min-w-0">
        <Label htmlFor={htmlFor} className="text-sm font-normal">
          {label}
        </Label>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn("min-w-0", controlClassName)}>{children}</div>
    </div>
  )
}
