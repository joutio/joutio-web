/**
 * Teinte unique du voyant de présence : gris si absent, vert si en ligne, jaune si suspendu.
 * Partagée par `PresenceBadge` (fiche joueur) et `PresenceDot` (tuiles Personnes), pour que
 * les deux surfaces ne divergent plus.
 */
export function presenceToneClass(online: boolean, suspended = false): string {
  if (suspended) return "bg-[var(--duel-gauge)]"
  return online ? "bg-[var(--duel-correct-accent)]" : "bg-muted-foreground"
}
