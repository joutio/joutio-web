import type { Icon } from '@phosphor-icons/react'
import { TierMedal } from '../brand/tier-medal'
import type { TierCode } from '../tokens.generated'
import { Button } from './button'
import { UnlockContent } from './unlock-content'

export type BadgeUnlockProps = {
  tier: TierCode
  /** Nom du badge. */
  badge: string
  /** Famille, par exemple `Rapidité`. */
  family: string
  /** Icône de la famille. */
  icon: Icon
  text: string
  next?: TierCode
  /** Suite de « Prochain : Platine », par exemple `à 100 réponses rapides.` */
  nextRule?: string
  /** Récompense à essayer, par exemple `Essayer Micah`. */
  reward?: { label: string; icon?: Icon; onClick?: () => void }
}

/** Un déblocage par badge gagné, dans `UnlockSequence` : le badge tombe. */
export function BadgeUnlock({ tier, badge, family, icon: FamilyIcon, text, next, nextRule, reward }: BadgeUnlockProps) {
  return (
    <UnlockContent
      tier={tier}
      crumbLead={<FamilyIcon size={16} weight="fill" aria-hidden />}
      crumbFrom={family}
      hero={<TierMedal tier={tier} icon={FamilyIcon} size={160} />}
      heroMotion="jo-drop"
      eyebrow="Nouveau badge débloqué"
      headline={badge}
      text={text}
      extra={
        reward && (
          <Button variant="gray" tone="neutral" size="S" icon={reward.icon} onClick={reward.onClick}>
            {reward.label}
          </Button>
        )
      }
      next={next && nextRule ? { tier: next, rule: nextRule, preview: <TierMedal tier={next} icon={FamilyIcon} size={48} state="locked" /> } : undefined}
    />
  )
}
