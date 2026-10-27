/**
 * Pastille de compteur d'une entrée de navigation (notifications non lues, défis/salons en
 * attente) — ancrée en haut à droite de l'icône, plafonnée à « 9+ ».
 */
export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="absolute -top-1 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-heading text-2xs font-bold text-primary-foreground">
      {count > 9 ? "9+" : count}
    </span>
  )
}
