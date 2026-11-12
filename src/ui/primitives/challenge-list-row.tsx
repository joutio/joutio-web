import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import type { TierCode } from '../tokens.generated'
import { Avatar, type AvatarProps } from './avatar'
import { Button, type ButtonProps } from './button'

export type ChallengeAction = { label: string; onClick?: () => void; loading?: boolean; disabled?: boolean }

export type ChallengeListRowProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'name'> & {
  name: string
  /** Sujet et délai restant, lus en entier : ils décident de la réponse. */
  sub?: string
  src?: string
  tier?: TierCode
  presence?: AvatarProps['presence']
  /** À droite : Accepter, Relancer. */
  primary: ChallengeAction
  /** Mise en avant de l'action principale : `filled` quand le joueur doit répondre, `tinted` sinon. */
  primaryVariant?: Extract<ButtonProps['variant'], 'filled' | 'tinted'>
  /** À gauche, en ton destructif : l'action met fin au défi (Refuser, Annuler). */
  secondary: ChallengeAction
  last?: boolean
}

/** Défi en attente : le joueur, puis deux actions sur toute la largeur. */
export function ChallengeListRow({ name, sub, src, tier, presence, primary, primaryVariant = 'filled', secondary, last = false, className, type = 'button', ...props }: ChallengeListRowProps) {
  return (
    <div className={cn('grid gap-2 px-4 pb-3', !last && 'border-b border-jo-border', className)}>
      <button type={type} className="jo-transition jo-focus-inset flex min-h-16 min-w-0 cursor-pointer items-center gap-3 py-2 text-left jo-pressed:opacity-60" {...props}>
        <Avatar name={name} src={src} tier={tier} presence={presence} size="list" />
        <span className="grid min-w-0 flex-1">
          <strong className="jo-type-headline truncate">{name}</strong>
          {sub && <span className="jo-type-caption truncate text-jo-muted">{sub}</span>}
        </span>
      </button>
      {/* Les actions restent hors du bouton de la ligne, pour ne pas imbriquer deux boutons. */}
      <div className="grid grid-cols-2 gap-2">
        <Button size="S" variant="tinted" tone="destructive" full onClick={secondary.onClick} loading={secondary.loading} disabled={secondary.disabled} aria-label={`${secondary.label}, ${name}`}>
          {secondary.label}
        </Button>
        <Button size="S" variant={primaryVariant} tone="accent" full onClick={primary.onClick} loading={primary.loading} disabled={primary.disabled} aria-label={`${primary.label}, ${name}`}>
          {primary.label}
        </Button>
      </div>
    </div>
  )
}
