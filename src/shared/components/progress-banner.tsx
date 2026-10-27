import { cn } from "cn"
import { Progress } from "@/components/ui/progress"

/**
 * Barre « questions complétées » des fiches thème **et** jauge Elo du profil — libellé
 * capitalisé + détail + pourcentage + barre (épaisseur et arrondis de la capsule V/N/D, couleurs
 * shadcn).
 */
interface ProgressBannerProps {
  label: string
  value: number
  /** Détail affiché avant le pourcentage (ex. « 7 / 100 »). */
  detail?: string
  className?: string
}

export function ProgressBanner({
  label,
  value,
  detail,
  className,
}: ProgressBannerProps) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-2xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">
          {detail ? `${detail} · ` : ""}
          {Math.round(pct)} %
        </span>
      </div>
      <Progress value={pct} />
    </div>
  )
}
