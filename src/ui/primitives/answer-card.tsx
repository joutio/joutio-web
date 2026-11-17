import { CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'
import { GainTag } from './gain-tag'
import { useT, type MessageKey } from '@/lib/i18n'

export type AnswerState = 'rest' | 'pending' | 'correct' | 'wrong' | 'unchosen' | 'disabled'
export type AnswerNotch = 'none' | 'me' | 'opp' | 'both'

const STATES: Record<AnswerState, string> = {
  rest: 'bg-jo-raised text-jo-text jo-pressed:bg-jo-hover',
  pending: 'bg-jo-border text-jo-text',
  correct: 'bg-jo-correct text-jo-on-correct',
  wrong: 'bg-jo-wrong text-jo-on-wrong',
  unchosen: 'bg-jo-raised text-jo-muted',
  disabled: 'bg-jo-raised text-jo-text opacity-40',
}

const LEFT = '0 calc(50% + 16px),14px 50%,0 calc(50% - 16px)'
const RIGHT = '100% calc(50% - 16px),calc(100% - 14px) 50%,100% calc(50% + 16px)'

const CLIPS: Record<AnswerNotch, string | undefined> = {
  none: undefined,
  me: `polygon(0 0,100% 0,100% 100%,0 100%,${LEFT})`,
  opp: `polygon(0 0,100% 0,${RIGHT},100% 100%,0 100%)`,
  both: `polygon(0 0,100% 0,${RIGHT},100% 100%,0 100%,${LEFT})`,
}

const WHO: Record<AnswerNotch, MessageKey | undefined> = {
  none: undefined,
  me: 'ds.yourChoice',
  opp: 'ds.opponentChoice',
  both: 'ds.bothChoices',
}

export type AnswerCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> & {
  label: string
  state?: AnswerState
  /** Encoche qui indique qui a choisi cette réponse. */
  notch?: AnswerNotch
  /** Points gagnés, affichés avec `details`. */
  gain?: number
  /** Ajoute l'icône de verdict et les points à la révélation. Piloté par un réglage du joueur. */
  details?: boolean
}

export function AnswerCard({ label, state = 'rest', notch = state === 'pending' ? 'me' : 'none', gain, details = false, className, type = 'button', ...props }: AnswerCardProps) {
  const t = useT()
  const revealed = state === 'correct' || state === 'wrong'
  const verdict = state === 'correct' ? t('ds.correctSuffix') : state === 'wrong' ? t('ds.wrongSuffix') : ''
  const showDetails = details && revealed
  const showGain = showDetails && gain !== undefined
  const MarkIcon = state === 'correct' ? CheckCircleIcon : XCircleIcon
  const points = showGain ? t('ds.plusPointsSuffix', { points: gain }) : ''
  const who = WHO[notch]

  return (
    <button
      type={type}
      disabled={state !== 'rest'}
      aria-label={`${label}${who ? t(who) : ''}${verdict}${points}`}
      style={{ clipPath: CLIPS[notch] }}
      className={cn(
        'jo-type-headline jo-transition jo-focus flex min-h-16 w-full items-center justify-center rounded-jo-sm px-6 py-2 text-center leading-5 text-balance enabled:cursor-pointer jo-pressed:scale-[.98]',
        STATES[state],
        showDetails && (notch === 'me' || notch === 'both' ? 'pl-6' : 'pl-3'),
        showDetails && (notch === 'opp' || notch === 'both' ? 'pr-6' : 'pr-3'),
        className,
      )}
      {...props}
    >
      {showDetails ? (
        <span className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <MarkIcon size={18} weight="fill" aria-hidden />
          <span className="min-w-0 wrap-anywhere">{label}</span>
          {showGain ? <GainTag points={gain} /> : <span />}
        </span>
      ) : (
        label
      )}
    </button>
  )
}
