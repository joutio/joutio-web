import { cn } from '../lib/cn'
import { Avatar } from './avatar'
import { Badge, type BadgeProps } from './badge'
import { Button } from './button'
import { ProgressBar } from './progress-bar'

export type RewardState = 'unlocked' | 'active' | 'locked' | 'premium'

const STATES: Record<RewardState, { variant: BadgeProps['variant']; label: string }> = {
  unlocked: { variant: 'correct', label: 'Débloquée' },
  active: { variant: 'accent', label: 'Utilisée' },
  locked: { variant: 'neutral', label: 'Verrouillée' },
  premium: { variant: 'accent', label: 'Premium' },
}

export type RewardCardProps = {
  title: string
  rule?: string
  state?: RewardState
  image?: string
  /** Nom de l'avatar sans image (avatar de base) : ses initiales. Par défaut, le titre. */
  avatarName?: string
  /** Avancement vers le déblocage, de 0 à 100. */
  progress?: number
  progressLabel?: string
  cta?: { label: string; onClick?: () => void }
  /** Choix dans une liste (éditeur d'avatar) : toute la carte se touche, comme un bouton radio. */
  onSelect?: () => void
  className?: string
}

export function RewardCard({ title, rule, state = 'unlocked', image, avatarName, progress, progressLabel, cta, onSelect, className }: RewardCardProps) {
  const { variant, label } = STATES[state]
  const classes = cn(
    'grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 rounded-jo-lg bg-jo-surface p-4',
    state === 'active' && 'ring-2 ring-jo-accent ring-inset',
    onSelect && 'jo-pressed jo-focus w-full cursor-pointer text-left',
    className,
  )
  const content = (
    <>
      <Avatar name={avatarName ?? title} src={image} size="xl" locked={state === 'locked' || state === 'premium'} />
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="jo-type-headline">{title}</strong>
          <Badge variant={variant}>{label}</Badge>
        </div>
        {rule && <p className="jo-type-callout text-pretty text-jo-muted">{rule}</p>}
        {progress !== undefined && <ProgressBar value={progress} label={progressLabel} showValue />}
        {cta && (
          <div className="mt-1">
            <Button
              size="S"
              variant={state === 'premium' ? 'filled' : 'gray'}
              tone={state === 'premium' ? 'accent' : 'neutral'}
              onClick={cta.onClick}
            >
              {cta.label}
            </Button>
          </div>
        )}
      </div>
    </>
  )
  return onSelect ? (
    <button type="button" role="radio" aria-checked={state === 'active'} onClick={onSelect} className={classes}>
      {content}
    </button>
  ) : (
    <article className={classes}>{content}</article>
  )
}
