import type { TierCode } from '../tokens.generated'
import { Avatar } from './avatar'
import { UnlockContent } from './unlock-content'
import { useT } from '@/lib/i18n'
import { tierKey } from '@joutio/client/i18n'

export type RankPromotionProps = {
  from: TierCode
  tier: TierCode
  next?: TierCode
  name: string
  src?: string
  /** Phrase sous le nom du rang. */
  text: string
  /** Suite de « Prochain : Émeraude », par exemple `à 1 200. Double reflet.` */
  nextRule?: string
}

/** Premier déblocage de la séquence (`UnlockSequence`) : le cadre se forge. */
export function RankPromotion({ from, tier, next, name, src, text, nextRule }: RankPromotionProps) {
  const t = useT()
  return (
    <UnlockContent
      tier={tier}
      crumbLead={<Avatar name={name} src={src} tier={from} size="sm" />}
      crumbFrom={t(tierKey(from))}
      hero={<Avatar name={name} src={src} tier={tier} size="hero" />}
      heroMotion="jo-celebrate"
      eyebrow={t('ds.newRank')}
      headline={t(tierKey(tier))}
      text={text}
      next={next && nextRule ? { tier: next, rule: nextRule, preview: <Avatar name={name} src={src} tier={next} size="row" locked /> } : undefined}
    />
  )
}
