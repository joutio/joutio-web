import type { Icon } from '@phosphor-icons/react'
import { ClockCountdownIcon, LightningIcon, LinkBreakIcon, NumberCircleTwoIcon, QuestionIcon, TimerIcon, XIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useMe, usePlayerIdentity } from '@/features/me'
import { useLanguageStore, useT, type MessageKey } from '@/lib/i18n'
import { useServerNow } from '@/lib/realtime'
import { returnTo, selectStatus, useSessionStore } from '@/lib/session'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Avatar, Badge, Button, EmptyState, IconButton, ListRow, PlayerName, Screen, Skeleton, TopicCard, tokens, type TierCode } from '@/ui'
import { countdownOf } from '../lib/countdown'
import { playService } from '../lib/play-service'

/** Conditions du duel, en `ListRow` informatives (`lancer-partie.md` § 2). */
const RULES: readonly { icon: Icon; label: MessageKey }[] = [
  { icon: TimerIcon, label: 'join.ruleRounds' },
  { icon: LightningIcon, label: 'join.ruleSpeed' },
  { icon: NumberCircleTwoIcon, label: 'join.ruleDouble' },
]

/** Colonne de 370 px au plus (face-à-face, conditions, bouton) : sur grand écran, la page garde une taille de téléphone. */
const COLUMN = 'mx-auto w-full max-w-[370px]'

type SeatProps = { name: string; src?: string; rating?: number | null; provisional?: boolean | null; premium?: boolean; guest?: string }

/** Une place du face-à-face : avatar, nom, rang et Elo ; sans compte, une place à prendre (`guest` : son indication). */
function Seat({ name, src, rating, provisional, premium, guest }: SeatProps) {
  const language = useLanguageStore((state) => state.language)
  const tier: TierCode | undefined = rating != null && !provisional ? tierOf(rating) : undefined
  return (
    <div className="grid min-w-0 justify-items-center gap-2 text-center">
      {guest ? (
        <span className="grid size-[88px] place-items-center rounded-jo-full border-2 border-dashed border-jo-border text-jo-muted">
          <QuestionIcon size={30} aria-hidden />
        </span>
      ) : (
        <Avatar name={name} src={src} tier={tier} size="xxl" />
      )}
      <PlayerName name={name} premium={premium} className={`jo-type-headline justify-center ${guest ? 'text-jo-muted' : ''}`} />
      {guest ? (
        <span className="jo-type-caption text-jo-muted">{guest}</span>
      ) : tier && rating != null ? (
        <Badge variant="tier" tier={tier}>{`${tokens.tier[tier].label} · ${rating.toLocaleString(language)}`}</Badge>
      ) : null}
    </div>
  )
}

/**
 * Rejoindre un salon (`lancer-partie.md` § 2, lab `rejoindre.tsx`, refonte face-à-face du 2026-11-14), ouvert par un
 * lien partagé, hors onglets : Fermer et échéance en haut, invitation, face-à-face de l'hôte et du joueur (place à
 * prendre sans session), `TopicCard` du sujet (240 px), conditions en `ListRow`, « Rejoindre le duel » en bas. Sans
 * session, la connexion (et l'onboarding) ramène ici.
 */
export function JoinPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const { roomId = '' } = useParams()
  const authenticated = useSessionStore(selectStatus) === 'authenticated'
  const me = useMe()
  const identity = usePlayerIdentity()
  const now = useServerNow()
  const room = useQuery({ queryKey: ['rooms', roomId], queryFn: () => playService.room(roomId), enabled: authenticated && Boolean(roomId), retry: 1 })
  const view = room.data
  const host = view?.opponent
  const hostAvatar = useUserAvatar(host)
  const myAvatar = useUserAvatar(authenticated ? me.data : null)
  const unavailable = room.isError || (view && (view.status !== 'WAITING_PLAYERS' || view.gameId !== null))
  const countdown = countdownOf(view?.expiresAt, now)

  const close = () => (window.history.state?.idx > 0 ? void navigate(-1) : void navigate(ROUTES.home, { replace: true }))
  const closeButton = <IconButton icon={XIcon} label={t('join.close')} variant="plain" tone="neutral" onClick={close} />

  const join = () => {
    if (!authenticated) {
      returnTo.remember(ROUTES.join(roomId))
      void navigate('/welcome')
      return
    }
    const topic = view ? { topicId: view.topic.topicId, name: topicName(view.topic.names, language), category: view.topic.category } : undefined
    void navigate(ROUTES.room(roomId), { replace: true, state: { topic } })
  }

  if (unavailable) {
    return (
      <Screen header={<div className="flex h-[52px] items-center px-2">{closeButton}</div>}>
        <EmptyState
          className="h-full"
          icon={LinkBreakIcon}
          title={t('join.unavailableTitle')}
          description={t('join.unavailableText')}
          action={
            <Button full onClick={() => void navigate(ROUTES.topics, { replace: true })}>
              {t('join.explore')}
            </Button>
          }
        />
      </Screen>
    )
  }

  const loading = authenticated && room.isPending
  const myProgression = me.data?.progression
  return (
    <Screen
      header={
        <div className="flex h-[52px] items-center justify-between pr-4 pl-2">
          {closeButton}
          {countdown && (
            <span className="jo-type-callout flex items-center gap-1.5 text-jo-muted">
              <ClockCountdownIcon size={16} aria-hidden />
              {t('join.expiresIn')} <span className="font-mono font-semibold text-jo-text">{countdown}</span>
            </span>
          )}
        </div>
      }
      // 370 px de bouton : la colonne plus la gouttière de 16 px de chaque côté.
      bottomBar={
        <div className="mx-auto grid w-full max-w-[402px] gap-2 px-4 pt-2 pb-2">
          <Button full icon={LightningIcon} disabled={authenticated && (room.isPending || me.data?.onboardingCompleted === false)} onClick={join}>
            {t(authenticated ? 'join.join' : 'join.signIn')}
          </Button>
          {!authenticated && <p className="jo-type-caption m-0 text-center text-pretty text-jo-muted">{t('join.noAccount')}</p>}
        </div>
      }
    >
      <div className="grid gap-6 px-4 pt-2 pb-6">
        <h1 className="jo-type-title-1 m-0 text-center text-balance">{host ? t('join.invitedBy', { name: host.pseudonym }) : t('join.invited')}</h1>
        <div className={`grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 ${COLUMN}`}>
          {loading || !host ? (
            <div className="grid justify-items-center">
              <Skeleton shape="circle" width={88} />
            </div>
          ) : (
            <Seat name={host.pseudonym} src={hostAvatar} rating={host.rating} provisional={host.provisional} premium={identity.premium(host)} />
          )}
          <span className="mt-[30px] grid size-7 place-items-center rounded-jo-full bg-jo-accent text-jo-on-accent" aria-hidden>
            <LightningIcon size={14} weight="fill" />
          </span>
          {authenticated && me.data ? (
            <Seat name={me.data.pseudonym} src={myAvatar} rating={myProgression?.rating} provisional={myProgression?.provisional} premium={me.data.premium === true} />
          ) : (
            <Seat name={t('join.guest')} guest={t('join.guestHint')} />
          )}
        </div>
        {view && (
          // Même largeur que les cartes paysage des rails de l'Accueil (240 px), centrée.
          <TopicCard
            title={topicName(view.topic.names, language)}
            category={toCategoryCode(view.topic.category)}
            image={view.topic.imageUrl ?? undefined}
            className="mx-auto max-w-[240px]"
          />
        )}
        {/* Conditions du duel : lignes informatives, comme les autorisations de l'onboarding. */}
        <div className={`overflow-hidden rounded-jo-lg bg-jo-surface ${COLUMN}`}>
          {RULES.map(({ icon, label }, index) => (
            <ListRow key={label} icon={icon} label={t(label)} control="none" last={index === RULES.length - 1} />
          ))}
        </div>
      </div>
    </Screen>
  )
}
