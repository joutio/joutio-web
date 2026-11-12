import type { ElementType, ReactNode } from 'react'
import { PremiumBadge } from '../brand/premium-badge'
import { cn } from '../lib/cn'

export type PlayerNameProps = {
  name: string
  /** Joueur Premium : `PremiumBadge` à droite du pseudonyme, 4 px d'écart. */
  premium?: boolean
  /** Côté du badge : 18 avec `headline`, 22 avec `title2`, 16 au-dessous. */
  badgeSize?: number
  /** Balise du nom (`strong` par défaut). */
  as?: ElementType
  /** Typographie et alignement : le pseudonyme se tronque, le badge reste visible. */
  className?: string
}

/** Pseudonyme d'un joueur, suivi du badge Premium s'il l'est (`marque.md` § PremiumBadge). */
export function PlayerName({ name, premium = false, badgeSize = 18, as: Tag = 'strong', className }: PlayerNameProps) {
  return (
    <Tag className={cn('flex max-w-full min-w-0 items-center gap-1', className)}>
      <span className="min-w-0 truncate">{name}</span>
      {premium && <PremiumBadge size={badgeSize} />}
    </Tag>
  )
}

export type PlayerLinkProps = {
  /** Ouvre la fiche du joueur (le Profil pour soi). Absent : rien de cliquable (duel, salon, matchmaking). */
  onOpen?: () => void
  name: string
  className?: string
  children: ReactNode
}

/**
 * Avatar ou pseudonyme cliquable vers la fiche du joueur (`primitives.md` § Identité d'un joueur). Sans `onOpen`, le
 * contenu est rendu tel quel : les écrans immersifs n'ouvrent jamais de fiche.
 */
export function PlayerLink({ onOpen, name, className, children }: PlayerLinkProps) {
  if (!onOpen) return <>{children}</>
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Voir la fiche de ${name}`}
      className={cn('jo-focus jo-transition min-w-0 max-w-full cursor-pointer rounded-jo-sm jo-pressed:opacity-70', className)}
    >
      {children}
    </button>
  )
}
