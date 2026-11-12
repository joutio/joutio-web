import { LightningIcon, LinkBreakIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useMe } from '@/features/me'
import { useLanguageStore, useT } from '@/lib/i18n'
import { returnTo, selectStatus, useSessionStore } from '@/lib/session'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { tierOf } from '@/shared/tier'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Avatar, Button, CATEGORY_ICONS, EmptyState, Pill, Screen, Skeleton } from '@/ui'
import { playService } from '../lib/play-service'

/**
 * Rejoindre un salon (`lancer-partie.md` § 2, lab `rejoindre.tsx`), ouvert par un lien partagé, hors onglets. Sans
 * session : même invitation, la connexion (et l'onboarding) ramène ici.
 */
export function JoinPage() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const navigate = useNavigate()
  const { roomId = '' } = useParams()
  const authenticated = useSessionStore(selectStatus) === 'authenticated'
  const me = useMe()
  const room = useQuery({ queryKey: ['rooms', roomId], queryFn: () => playService.room(roomId), enabled: authenticated && Boolean(roomId), retry: 1 })
  const view = room.data
  const hostAvatar = useUserAvatar(view?.opponent)
  const unavailable = room.isError || (view && (view.status !== 'WAITING_PLAYERS' || view.gameId !== null))
  const host = view?.opponent?.pseudonym
  const hostTier = view?.opponent?.rating != null && !view.opponent.provisional ? tierOf(view.opponent.rating) : undefined

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
      <Screen>
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

  return (
    <Screen>
      <div className="flex min-h-full flex-col gap-6 px-4 pt-8 pb-6">
        <div className="grid flex-1 content-center justify-items-center gap-4 text-center">
          {authenticated && room.isPending ? <Skeleton shape="circle" width={140} /> : <Avatar name={host ?? 'Joutio'} src={hostAvatar} tier={hostTier} size="preview" />}
          <h1 className="jo-type-title-1 m-0 text-balance">{host ? t('join.invitedBy', { name: host }) : t('join.invited')}</h1>
          {view && <Pill icon={CATEGORY_ICONS[toCategoryCode(view.topic.category)]}>{topicName(view.topic.names, language)}</Pill>}
          <p className="jo-type-body m-0 max-w-[320px] text-pretty text-jo-muted">{t('join.rules')}</p>
        </div>
        <div className="grid gap-2">
          <Button full icon={LightningIcon} disabled={authenticated && (room.isPending || me.data?.onboardingCompleted === false)} onClick={join}>
            {t(authenticated ? 'join.join' : 'join.signIn')}
          </Button>
          {!authenticated && <p className="jo-type-caption m-0 text-center text-pretty text-jo-muted">{t('join.noAccount')}</p>}
        </div>
      </div>
    </Screen>
  )
}
