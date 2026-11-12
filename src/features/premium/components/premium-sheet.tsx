import { ChartLineUpIcon, CheckIcon, CrownSimpleIcon, LightningIcon, PencilSimpleIcon, ProhibitIcon, UserCircleIcon } from '@phosphor-icons/react'
import { planLimits, PREMIUM_LIMITS } from '@joutio/client-domain/premium'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useT, type MessageKey } from '@/lib/i18n'
import { Button, ListRow, MobileSheet } from '@/ui'
import { usePremiumSheet, type PremiumReason } from '../premium-store'

const PERKS: readonly { icon: typeof ProhibitIcon; label: MessageKey }[] = [
  { icon: ProhibitIcon, label: 'premium.perkAds' },
  { icon: LightningIcon, label: 'premium.perkLimits' },
  { icon: ChartLineUpIcon, label: 'premium.perkStats' },
  { icon: UserCircleIcon, label: 'premium.perkAvatars' },
  { icon: PencilSimpleIcon, label: 'premium.perkCreation' },
]

const REASONS: Record<NonNullable<PremiumReason>, MessageKey> = {
  quota: 'premium.quotaReason',
  topics: 'premium.limitTopics',
  questions: 'premium.limitQuestions',
  team: 'premium.limitTeam',
  frozen: 'premium.limitFrozen',
}

/**
 * Premium (`design/specs/screens/premium.md`, lab `/screens/premium?view=compact`, variante Bientôt) : couronne,
 * accroche, cinq avantages, puis « Rejoindre la liste ». Ni prix ni essai tant que l'offre n'est pas ouverte.
 */
export function PremiumHost() {
  const t = useT()
  const { open, reason, joined, close, join } = usePremiumSheet()
  const limits = planLimits(useMe().data)
  const premium = PREMIUM_LIMITS
  // Chiffres lus dans `MeView.limits` (le plan du joueur) et dans les défauts Premium, jamais figés dans les textes.
  const values: Partial<Record<MessageKey, Record<string, number>>> = {
    'premium.quotaReason': { limit: limits.pendingChallenges, premium: premium.pendingChallenges },
    'premium.limitTopics': { premium: premium.publishedTopics },
    'premium.limitQuestions': { limit: limits.questionsPerTopic, premium: premium.questionsPerTopic },
    'premium.limitFrozen': { premium: premium.publishedTopics },
    'premium.perkLimits': { challenges: premium.pendingChallenges, rooms: premium.openRooms },
    'premium.perkCreation': { topics: premium.publishedTopics, questions: premium.questionsPerTopic },
  }
  const pitch = reason ? t(REASONS[reason], values[REASONS[reason]]) : t('premium.soonPitch')
  return (
    <MobileSheet
      open={open}
      onClose={close}
      title={t('premium.title')}
      tall
      footer={
        <div className="grid gap-2">
          <Button full icon={joined ? CheckIcon : undefined} variant={joined ? 'gray' : 'filled'} tone={joined ? 'neutral' : 'accent'} disabled={joined} onClick={join}>
            {t(joined ? 'premium.joined' : 'premium.join')}
          </Button>
          <p className="jo-type-caption m-0 text-center text-pretty text-jo-muted">{t('premium.waitlistText')}</p>
        </div>
      }
    >
      <div className="grid gap-4">
        <div className="grid justify-items-center gap-2 text-center">
          <span className="grid size-16 -rotate-6 place-items-center rounded-jo-lg bg-jo-accent text-jo-on-accent">
            <CrownSimpleIcon size={32} weight="fill" aria-hidden />
          </span>
          <h2 className="jo-type-title-2 m-0 text-balance">{t('premium.headline')}</h2>
          <p className="jo-type-callout m-0 text-pretty text-jo-muted">{pitch}</p>
        </div>
        <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
          {PERKS.map((perk, index) => (
            <ListRow key={perk.label} icon={perk.icon} label={t(perk.label, values[perk.label])} control="none" last={index === PERKS.length - 1} />
          ))}
        </div>
      </div>
    </MobileSheet>
  )
}

/** `/premium` (`web.md` § 2) : la feuille s'ouvre par-dessus l'Accueil, comme depuis n'importe quelle entrée. */
export function PremiumRoute() {
  const show = usePremiumSheet((state) => state.show)
  useEffect(() => show(), [show])
  return <Navigate to="/" replace />
}
