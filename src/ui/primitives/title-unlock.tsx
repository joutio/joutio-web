import { CheckCircleIcon } from '@phosphor-icons/react'
import { TitleRibbon } from '../brand/title-ribbon'
import type { TierCode } from '../tokens.generated'
import { Button } from './button'
import { Pill } from './pill'
import { UnlockContent } from './unlock-content'

export type TitleUnlockProps = {
  tier: TierCode
  /** Nom du titre. */
  title: string
  topic: string
  text: string
  next?: TierCode
  /** Suite de « Prochain : Platine », par exemple `à 3 000 XP.` */
  nextRule?: string
  /** Porté : « Porter ce titre » laisse place à la pastille « Titre porté ». */
  worn?: boolean
  onWear?: () => void
}

/** Un déblocage par titre gagné, dans `UnlockSequence` : le ruban se déroule. */
export function TitleUnlock({ tier, title, topic, text, next, nextRule, worn = false, onWear }: TitleUnlockProps) {
  return (
    <UnlockContent
      tier={tier}
      crumbFrom={topic}
      hero={<TitleRibbon tier={tier} text={title} width={300} />}
      heroMotion="jo-unroll"
      eyebrow="Nouveau titre débloqué"
      headline={title}
      text={text}
      extra={
        worn ? (
          <Pill tone="correct" icon={CheckCircleIcon}>
            Titre porté
          </Pill>
        ) : (
          <Button variant="gray" tone="neutral" size="S" icon={CheckCircleIcon} onClick={onWear}>
            Porter ce titre
          </Button>
        )
      }
      next={next && nextRule ? { tier: next, rule: nextRule, preview: <TitleRibbon tier={next} text="" width={96} state="locked" /> } : undefined}
    />
  )
}
