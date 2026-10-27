import { useTranslation } from "react-i18next"
import { ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

/** Badge public d'un compte suspendu — aucun motif ni échéance n'est exposé. */
export function SuspendedBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-destructive/40 text-destructive", className)}
    >
      <ShieldAlert />
      {t("moderation.suspendedBadge")}
    </Badge>
  )
}
