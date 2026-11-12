import type { TopicCardView } from '@joutio/client-domain/api-types'
import { MagnifyingGlassIcon } from '@phosphor-icons/react'
import { useState } from 'react'
import { DEFAULT_TOPIC_SORT, useTopics } from '@/features/topics'
import { useDebounced } from '@/shared/use-debounced'
import { useLanguageStore, useT } from '@/lib/i18n'
import { toCategoryCode, topicName } from '@/shared/topics'
import { EmptyState, FeedFooter, MobileSheet, SearchField, Skeleton, TopicRow } from '@/ui'

export type ChallengeTopicSheetProps = {
  player: string
  /** Titre de la feuille ; « Défier {player} » par défaut. */
  title?: string
  open: boolean
  onClose: () => void
  onPick: (topic: TopicCardView) => void
}

/** Choix du sujet d'un défi (lab `challenge-sheet.tsx`) : catalogue paginé et recherche. L'appelant change sa clé à chaque ouverture pour vider la recherche. */
export function ChallengeTopicSheet({ player, title, open, onClose, onPick }: ChallengeTopicSheetProps) {
  const t = useT()
  const language = useLanguageStore((state) => state.language)
  const [query, setQuery] = useState('')
  const search = useDebounced(query.trim(), 250)
  const topics = useTopics({ query: search, categories: [], sort: DEFAULT_TOPIC_SORT }, open)
  const list = topics.data?.pages.flatMap((page) => page.topics) ?? []
  return (
    <MobileSheet open={open} onClose={onClose} title={title ?? t('player.challengeTitle', { name: player })} subtitle={t('player.pickTopic')} tall>
      <div className="grid gap-3">
        <div className="sticky top-0 z-10 bg-jo-surface pb-1">
          <SearchField value={query} onChange={setQuery} placeholder={t('player.searchTopic')} label={t('player.searchTopic')} />
        </div>
        {topics.isPending ? (
          [0, 1, 2].map((index) => <Skeleton key={index} shape="row" />)
        ) : list.length === 0 ? (
          <EmptyState icon={MagnifyingGlassIcon} title={t('player.noTopic')} description={t('player.noTopicText')} />
        ) : (
          <>
            <div className="overflow-hidden rounded-jo-lg bg-jo-raised">
              {list.map((topic, index) => (
                <TopicRow
                  key={topic.topicId}
                  title={topicName(topic.names, language)}
                  category={toCategoryCode(topic.category)}
                  image={topic.pictogramUrl ?? topic.imageUrl ?? undefined}
                  onClick={() => {
                    onPick(topic)
                    onClose()
                  }}
                  last={index === list.length - 1}
                />
              ))}
            </div>
            <FeedFooter
              state={topics.isFetchingNextPage ? 'loading' : topics.isError ? 'error' : topics.hasNextPage ? 'more' : 'end'}
              pages={topics.data?.pages.length ?? 1}
              onLoadMore={() => void topics.fetchNextPage()}
              onRetry={() => void topics.fetchNextPage()}
              endLabel={t('player.topicsEnd')}
            />
          </>
        )}
      </div>
    </MobileSheet>
  )
}
