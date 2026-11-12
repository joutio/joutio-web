import { useId, type ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Button } from '../primitives/button'
import { SectionHeader } from '../primitives/section-header'
import { TopicCard, type TopicCardProps } from '../primitives/topic-card'
import { Rail } from './rail'

const MAX = 10
export const TOP_TEN_CARD_WIDTH = 172
const CARD_WIDTH = TOP_TEN_CARD_WIDTH
/** Part visible du chiffre : la carte recouvre le reste, il suffit de le reconnaître. */
const DIGIT_WIDTH = { one: 42, single: 60, double: 112 }
/** Resserre le 10 sans que le zéro touche le 1. */
const DOUBLE_SPACING = '-0.08em'
/** Hauteur du chiffre, calée sur le token `numericRank`. */
const NUMERAL_HEIGHT = 120
const NUMERAL_BASELINE = 116

export type TopTenTopic = Pick<TopicCardProps, 'title' | 'category' | 'image'>

export type TopTenProps = {
  /** Sujets du classement, dans l'ordre. Seuls les 10 premiers sont affichés. */
  topics: readonly TopTenTopic[]
  title?: string
  onSelect?: (topic: TopTenTopic, rank: number) => void
  /** Affiche « Tout voir ». */
  onSeeAll?: () => void
  className?: string
}

const digitWidth = (rank: number) => (rank >= MAX ? DIGIT_WIDTH.double : rank === 1 ? DIGIT_WIDTH.one : DIGIT_WIDTH.single)

/** Chiffre plein et sombre, au contour clair qui s'efface sous la carte. */
function RankNumeral({ rank }: { rank: number }) {
  const id = useId()
  const stroke = `${id}-stroke`
  const fill = `${id}-fill`
  return (
    <svg aria-hidden width={digitWidth(rank) + 48} height={NUMERAL_HEIGHT} className="absolute top-2 left-0 overflow-visible">
      <defs>
        <linearGradient id={stroke} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--jo-rank-stroke)" />
          <stop offset="0.5" stopColor="var(--jo-rank-stroke)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--jo-rank-stroke)" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={fill} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--jo-rank-fill)" />
          <stop offset="1" stopColor="var(--jo-bg)" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y={NUMERAL_BASELINE}
        className="jo-type-numeric-rank"
        fill={`url(#${fill})`}
        stroke={`url(#${stroke})`}
        strokeWidth="2.5"
        style={rank >= MAX ? { letterSpacing: DOUBLE_SPACING } : undefined}
      >
        {rank}
      </text>
    </svg>
  )
}

function Ranked({ rank, children }: { rank: number; children: ReactNode }) {
  return (
    <div className="relative" style={{ paddingLeft: digitWidth(rank) }}>
      <RankNumeral rank={rank} />
      {children}
    </div>
  )
}

/** Classement des sujets : rail d'affiches avec le rang en chiffre géant, que la carte chevauche. */
export function TopTen({ topics, title = 'Top 10 du moment', onSelect, onSeeAll, className }: TopTenProps) {
  return (
    <section className={cn('grid gap-3', className)}>
      <SectionHeader
        className="px-4"
        title={title}
        action={
          onSeeAll && (
            <Button variant="plain" size="S" className="-mr-3" onClick={onSeeAll}>
              Tout voir
            </Button>
          )
        }
      />
      <Rail itemWidth={(index) => CARD_WIDTH + digitWidth(index + 1)} label={title}>
        {topics.slice(0, MAX).map((topic, index) => (
          <Ranked key={topic.title} rank={index + 1}>
            <TopicCard {...topic} orientation="portrait" className="relative" aria-label={`${index + 1}. ${topic.title}`} onClick={() => onSelect?.(topic, index + 1)} />
          </Ranked>
        ))}
      </Rail>
    </section>
  )
}
