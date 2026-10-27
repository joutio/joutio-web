import { cn } from "@/lib/utils"
import { TOKEN } from "@/shared/theme/tokens"

interface ArenaPlaceholderProps {
  message: string
  /** Fond duel sombre (écrans immersifs) au lieu du fond de page. */
  duel?: boolean
}

/** Écran d'attente centré de l'arène (préparation, reconnexion, bascule résultat). */
export function ArenaPlaceholder({
  message,
  duel = false,
}: ArenaPlaceholderProps) {
  return (
    <div
      className={cn(
        "grid h-full place-items-center",
        duel ? "qu-immersive-safe" : "bg-background"
      )}
      style={duel ? { background: TOKEN.duelBg } : undefined}
    >
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
