import type { PlayerCardView } from '@joutio/client-domain/api-types'
import type { BotDifficulty } from '@joutio/client-domain/game'
import { GlobeHemisphereWestIcon, LinkIcon, MagnifyingGlassIcon, RobotIcon, UserPlusIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { usePlayerIdentity } from '@/features/me'
import { useT, type MessageKey } from '@/lib/i18n'
import { useUserAvatar } from '@/shared/avatar'
import { feedFooterProps } from '@/shared/paging'
import { tierOf } from '@/shared/tier'
import { useDebounced } from '@/shared/use-debounced'
import { Button, EmptyState, FeedFooter, ListRow, MobileSheet, PlayerRow, RadioGroup, SearchField, Segmented, Skeleton } from '@/ui'
import { useBotDifficulty, useChallengePlayer, useContacts, useCreatePrivateRoom, useStartMatchmaking, useStartTraining, type PlayTopic } from '../hooks/use-play'

export type DuelStep = 'modes' | 'training' | 'player'
type Contacts = 'following' | 'followers'

/** Ordre des modes : décision du 2026-11-10 (`lancer-partie.md` § 5). */
const MODES = [
  { id: 'world', icon: GlobeHemisphereWestIcon, label: 'play.modeWorld', sub: 'play.modeWorldSub' },
  { id: 'player', icon: UserPlusIcon, label: 'play.modePlayer', sub: 'play.modePlayerSub' },
  { id: 'training', icon: RobotIcon, label: 'play.modeTraining', sub: 'play.modeTrainingSub' },
  { id: 'room', icon: LinkIcon, label: 'play.modeRoom', sub: 'play.modeRoomSub' },
] as const satisfies readonly { id: string; icon: unknown; label: MessageKey; sub: MessageKey }[]

const LEVELS: readonly { value: BotDifficulty; label: MessageKey; sub: MessageKey }[] = [
  { value: 'EASY', label: 'play.levelEasy', sub: 'play.levelEasySub' },
  { value: 'NORMAL', label: 'play.levelNormal', sub: 'play.levelNormalSub' },
  { value: 'HARD', label: 'play.levelHard', sub: 'play.levelHardSub' },
]

function ContactRow({ player, last, onClick }: { player: PlayerCardView; last: boolean; onClick: () => void }) {
  const src = useUserAvatar(player)
  const identity = usePlayerIdentity()
  return (
    <PlayerRow
      name={player.pseudonym}
      premium={identity.premium(player)}
      src={src}
      tier={player.rating != null && !player.provisional ? tierOf(player.rating) : undefined}
      chevron
      onClick={onClick}
      last={last}
    />
  )
}

function PlayerList({ direction, query, enabled, onChallenge }: { direction: Contacts; query: string; enabled: boolean; onChallenge: (player: PlayerCardView) => void }) {
  const t = useT()
  const list = useContacts(direction, query, enabled)
  const players = list.data?.pages.flatMap((page) => page.content) ?? []
  if (list.isPending)
    return (
      <div className="grid gap-2">
        <Skeleton shape="row" />
        <Skeleton shape="row" />
        <Skeleton shape="row" />
      </div>
    )
  if (players.length === 0) return <EmptyState icon={MagnifyingGlassIcon} title={t('play.noPlayerTitle')} description={t('play.noPlayerText')} />
  return (
    <>
      <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
        {players.map((player, index) => (
          <ContactRow key={player.userId} player={player} last={index === players.length - 1} onClick={() => onChallenge(player)} />
        ))}
      </div>
      <FeedFooter {...feedFooterProps(list)} endLabel={t('play.playersEnd')} />
    </>
  )
}

export type DuelSheetProps = {
  open: boolean
  onClose: () => void
  topic: PlayTopic
  /** Étape ouverte d'emblée (matchmaking : « Défier un ami »). */
  startStep?: DuelStep
  /** Ouvre seulement `startStep`, sans la feuille des modes dessous ni retour vers elle. */
  direct?: boolean
}

/**
 * Lancer un duel (`lancer-partie.md` § 1, lab `duel-sheet.tsx`) : quatre modes ; difficulté et adversaire s'empilent
 * par-dessus, les fermer ramène aux modes. La difficulté reste en mémoire sur l'appareil.
 */
export function DuelSheet({ open, onClose, topic, startStep = 'modes', direct = false }: DuelSheetProps) {
  const t = useT()
  const [step, setStep] = useState<DuelStep>(startStep)
  const wasOpen = useRef(open)
  const level = useBotDifficulty((state) => state.difficulty)
  const setLevel = useBotDifficulty((state) => state.set)
  const [contacts, setContacts] = useState<Contacts>('following')
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim())
  const matchmaking = useStartMatchmaking()
  const training = useStartTraining()
  const room = useCreatePrivateRoom()
  const challenge = useChallengePlayer()

  // Repart du début à l'ouverture : la feuille garde son contenu pendant qu'elle se referme.
  useEffect(() => {
    if (open && !wasOpen.current) {
      setStep(direct ? startStep : 'modes')
      setQuery('')
    }
    wasOpen.current = open
  }, [open, direct, startStep])

  // En accès direct, fermer l'étape ferme tout : il n'y a pas de modes où revenir.
  const toModes = direct ? onClose : () => setStep('modes')
  const pending = matchmaking.isPending || room.isPending
  const choose = (mode: (typeof MODES)[number]['id']) => {
    if (pending) return
    if (mode === 'player' || mode === 'training') return setStep(mode)
    if (mode === 'world') matchmaking.mutate(topic, { onSuccess: onClose })
    else room.mutate(topic, { onSuccess: onClose })
  }

  return (
    <>
      {/* Tant qu'une feuille est empilée, Échap et le voile ne ferment qu'elle. */}
      <MobileSheet open={open && !direct} onClose={step === 'modes' ? onClose : toModes} title={t('topic.duel')} subtitle={topic.name}>
        <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
          {MODES.map((mode, index) => (
            <ListRow key={mode.id} icon={mode.icon} label={t(mode.label)} sub={t(mode.sub)} control="chevron" onClick={() => choose(mode.id)} last={index === MODES.length - 1} />
          ))}
        </div>
      </MobileSheet>
      <MobileSheet
        open={open && step === 'training'}
        onClose={toModes}
        title={t('play.levelTitle')}
        subtitle={topic.name}
        footer={
          <Button full loading={training.isPending} onClick={() => training.mutate({ topic, difficulty: level }, { onSuccess: onClose })}>
            {t('play.startTraining')}
          </Button>
        }
      >
        <div className="grid gap-3">
          <RadioGroup label={t('play.level')} className="overflow-hidden rounded-jo-lg bg-jo-raised">
            {LEVELS.map(({ value, label, sub }, index) => (
              <ListRow key={value} icon={RobotIcon} label={t(label)} sub={t(sub)} control="radio" on={level === value} onToggle={() => setLevel(value)} last={index === LEVELS.length - 1} />
            ))}
          </RadioGroup>
          <p className="jo-type-caption m-0 text-center text-pretty text-jo-muted">{t('play.noXp')}</p>
        </div>
      </MobileSheet>
      <MobileSheet open={open && step === 'player'} onClose={toModes} title={t('play.playerTitle')} subtitle={topic.name} tall>
        <div className="grid gap-3">
          <div className="sticky top-0 z-10 grid gap-2 bg-jo-surface pb-1">
            <SearchField value={query} onChange={setQuery} placeholder={t('play.searchPlayer')} label={t('play.searchPlayer')} />
            <Segmented
              label={t('play.contacts')}
              options={[
                { value: 'following', label: t('play.following') },
                { value: 'followers', label: t('play.followers') },
              ]}
              value={contacts}
              onChange={setContacts}
            />
          </div>
          <PlayerList
            direction={contacts}
            query={search}
            enabled={open && step === 'player'}
            onChallenge={(player) => {
              onClose()
              challenge.mutate({ topic, opponent: { userId: player.userId, pseudonym: player.pseudonym } })
            }}
          />
        </div>
      </MobileSheet>
    </>
  )
}
