import { LockSimpleIcon } from '@phosphor-icons/react'
import { showPremium } from '@/features/premium'
import { useT } from '@/lib/i18n'
import { Notice } from '@/ui'

/**
 * Sujets gelés (`creation.md` § 3) : sans Premium, au-delà du plafond de sujets publiés, les sujets publiés restent
 * jouables mais ne se modifient plus. Repasser en brouillon jusqu'au plafond, ou Premium, lève le gel.
 */
export function FrozenNotice({ published, limit, className }: { published: number; limit: number; className?: string }) {
  const t = useT()
  return (
    <Notice
      tone="info"
      icon={LockSimpleIcon}
      title={t('workshop.frozenTitle')}
      message={t('workshop.frozenText', { count: published, max: limit })}
      action={{ label: t('play.goPremium'), onClick: () => showPremium('frozen') }}
      className={className}
    />
  )
}
