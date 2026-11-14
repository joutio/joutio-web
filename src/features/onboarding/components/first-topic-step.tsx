import { useLayoutEffect, useRef, useState } from 'react'
import { LightningIcon, SwordIcon } from '@phosphor-icons/react'
import { useCreateBotRoom } from '@/features/play'
import { useLanguageStore, useT } from '@/lib/i18n'
import { returnTo } from '@/lib/session'
import { trackEvent } from '@/lib/telemetry'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { Button, EmptyState, Notice, RadioGroup, Skeleton, TopicCard, TopicRow } from '@/ui'
import { useCompleteOnboarding, useRecommendations } from '../hooks/use-onboarding'
import { useOnboardingStore } from '../onboarding-store'
import { Steps } from './steps'

/**
 * Premier thème : aperçu du thème choisi, puis la liste radio des recommandations. Titre et aperçu restent fixes, seule
 * la liste défile ; un dégradé signale la suite. « Explorer l'accueil » termine l'onboarding ; « Découvrir le duel » crée
 * d'abord le salon bot (robot facile, thème choisi) et attend la réponse, puis termine l'onboarding : la sortie de
 * l'onboarding ouvre directement ce salon, sans passer par l'accueil (2026-11-14).
 */
export function FirstTopicStep() {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const universes = useOnboardingStore((state) => state.universes)
  const recommendations = useRecommendations(universes)
  const complete = useCompleteOnboarding()
  const botRoom = useCreateBotRoom()
  const topics = recommendations.data ?? []
  const [pickedId, setPickedId] = useState<string | null>(null)
  const picked = topics.find((topic) => topic.topicId === pickedId) ?? topics[0]

  const list = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const updateMore = () => {
    const element = list.current
    setMore(element ? element.scrollTop + element.clientHeight < element.scrollHeight - 4 : false)
  }
  useLayoutEffect(updateMore, [topics.length])

  const finish = () => complete.mutate(undefined, { onSuccess: () => trackEvent('onboarding_completed') })
  // Salon d'abord (commande traitée, le salon existe), puis onboarding terminé : la sortie de l'onboarding
  // (`onboarding-page.tsx`, `returnTo`) ouvre ce salon au lieu de l'accueil.
  const play = async () => {
    if (!picked) return
    let roomId: string
    try {
      roomId = (await botRoom.mutateAsync({ topicId: picked.topicId, difficulty: 'EASY' })).id
    } catch {
      return
    }
    returnTo.remember(ROUTES.room(roomId))
    try {
      await complete.mutateAsync()
      trackEvent('onboarding_completed')
    } catch {
      returnTo.remember(null)
    }
  }

  return (
    <Steps
      index={2}
      fill
      action={
        <Button variant="plain" tone="neutral" disabled={complete.isPending || botRoom.isPending} onClick={finish}>
          {t('onboarding.first.explore')}
        </Button>
      }
      footer={
        <div className="grid gap-2">
          {complete.isError && <Notice tone="error" title={t('onboarding.first.completeError')} message={t('common.checkConnection')} />}
          <Button full icon={LightningIcon} disabled={!picked} loading={complete.isPending || botRoom.isPending} onClick={() => void play()}>
            {t('onboarding.first.play')}
          </Button>
        </div>
      }
    >
      <div className="grid flex-none gap-2">
        <h1 className="jo-type-title-1 m-0">{t('onboarding.first.title')}</h1>
        <p className="jo-type-body m-0 text-pretty text-jo-muted">{t('onboarding.first.subtitle')}</p>
      </div>
      {recommendations.isPending && universes.length > 0 ? (
        <div aria-busy className="grid gap-4">
          <Skeleton shape="card" />
          <Skeleton shape="row" />
          <Skeleton shape="row" />
        </div>
      ) : recommendations.isError ? (
        <Notice
          tone="error"
          title={t('onboarding.first.loadError')}
          message={t('common.checkConnectionShort')}
          action={{ label: t('common.retry'), onClick: () => void recommendations.refetch(), loading: recommendations.isFetching }}
        />
      ) : !picked ? (
        <EmptyState icon={SwordIcon} title={t('onboarding.first.empty')} description={t('onboarding.first.emptyHint')} />
      ) : (
        <>
          <TopicCard
            title={topicName(picked.names, language)}
            category={toCategoryCode(picked.category)}
            image={picked.imageUrl ?? undefined}
            orientation="landscape"
            className="flex-none"
            tabIndex={-1}
          />
          <div className="relative min-h-0 flex-1">
            <RadioGroup ref={list} label={t('onboarding.first.list')} onScroll={updateMore} className="jo-no-scrollbar h-full overflow-y-auto rounded-jo-lg bg-jo-surface">
              {topics.map((topic, index) => (
                <TopicRow
                  key={topic.topicId}
                  title={topicName(topic.names, language)}
                  category={toCategoryCode(topic.category)}
                  pictogram={topic.pictogramUrl ?? undefined}
                  image={topic.imageUrl ?? undefined}
                  control="radio"
                  on={topic.topicId === picked.topicId}
                  onClick={() => setPickedId(topic.topicId)}
                  last={index === topics.length - 1}
                />
              ))}
            </RadioGroup>
            {more && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-jo-lg bg-linear-to-t from-jo-surface to-transparent" />}
          </div>
        </>
      )}
    </Steps>
  )
}
