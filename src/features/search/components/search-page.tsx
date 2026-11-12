import type { SuggestionView } from '@joutio/client-domain/api-types'
import { ClockCounterClockwiseIcon, MagnifyingGlassIcon, WarningCircleIcon, WifiSlashIcon } from '@phosphor-icons/react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore, useT } from '@/lib/i18n'
import { api } from '@/lib/api'
import { useConnectionStore } from '@/lib/realtime'
import { useUserAvatar } from '@/shared/avatar'
import { ROUTES } from '@/shared/routes'
import { toCategoryCode, topicName } from '@/shared/topics'
import { useBack } from '@/shared/use-back'
import { useDebounced } from '@/shared/use-debounced'
import { Button, EmptyState, ListRow, PlayerRow, Screen, SearchField, SectionHeader, Skeleton, TopicRow } from '@/ui'

const MIN_QUERY = 2
const MAX_RECENTS = 5
const RECENTS_KEY = 'joutio.search.recents'
const CARD = 'overflow-hidden rounded-jo-lg bg-jo-surface'

const readRecents = (): string[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENTS) : []
  } catch {
    return []
  }
}
const writeRecents = (recents: readonly string[]) => {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents))
  } catch {
    // Sans stockage, les récentes valent pour la session.
  }
}

function PlayerResult({ player, last, onOpen }: { player: SuggestionView; last: boolean; onOpen: () => void }) {
  const src = useUserAvatar({ userId: player.id, avatarOptions: player.avatarOptions })
  return <PlayerRow name={player.label} src={src} sub={player.subtitle ?? undefined} chevron onClick={onOpen} last={last} />
}

/**
 * Recherche globale (`design/specs/screens/recherche.md`, lab `/screens/recherche?view=compact`) : un champ focalisé à
 * l'ouverture, les récentes (5, sur l'appareil) tant qu'il est vide, puis Sujets et Joueurs dès 2 lettres (250 ms).
 * Toucher un résultat l'ajoute aux récentes et ouvre sa fiche ; Annuler revient à l'écran précédent champ vide.
 */
export function SearchPage() {
  const t = useT()
  const navigate = useNavigate()
  const language = useLanguageStore((state) => state.language)
  const back = useBack(ROUTES.home)
  const offline = useConnectionStore((state) => state.status) === 'offline'
  const field = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState(readRecents)
  const term = useDebounced(query.trim(), 250)
  const searching = term.length >= MIN_QUERY
  const results = useQuery({
    queryKey: ['suggestions', term],
    queryFn: () => api.get<SuggestionView[]>('/api/suggestions', { query: { q: term, limit: 10 } }),
    enabled: searching && !offline,
    staleTime: 30_000,
  })
  const topics = (results.data ?? []).filter((item) => item.type === 'TOPIC')
  const players = (results.data ?? []).filter((item) => item.type === 'PLAYER')

  useEffect(() => field.current?.querySelector('input')?.focus(), [])

  const remember = (label: string) => {
    const next = [label, ...recents.filter((item) => item !== label)].slice(0, MAX_RECENTS)
    setRecents(next)
    writeRecents(next)
  }
  const clear = () => {
    setRecents([])
    writeRecents([])
  }

  return (
    <Screen
      header={
        <div ref={field} className="px-4 py-2">
          <SearchField value={query} onChange={setQuery} placeholder={t('search.placeholder')} label={t('search.label')} onCancel={() => (query ? setQuery('') : back())} active />
        </div>
      }
    >
      <div className="grid gap-6 px-4 pt-2 pb-8">
        {offline ? (
          <EmptyState icon={WifiSlashIcon} title={t('search.offline')} description={t('search.offlineText')} />
        ) : query.trim().length < MIN_QUERY ? (
          recents.length > 0 ? (
            <section className="grid gap-3">
              <SectionHeader
                title={t('search.recents')}
                action={
                  <Button variant="plain" size="S" onClick={clear}>
                    {t('search.clear')}
                  </Button>
                }
              />
              <div className={CARD}>
                {recents.map((item, index) => (
                  <ListRow key={item} icon={ClockCounterClockwiseIcon} label={item} control="chevron" onClick={() => setQuery(item)} last={index === recents.length - 1} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState icon={MagnifyingGlassIcon} title={t('search.emptyTitle')} description={t('search.emptyText')} />
          )
        ) : !searching || results.isPending ? (
          <div className="grid gap-3" aria-label={t('common.loading')}>
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} shape="row" />
            ))}
          </div>
        ) : results.isError ? (
          <EmptyState
            icon={WarningCircleIcon}
            title={t('search.error')}
            description={t('home.errorText')}
            action={
              <Button loading={results.isRefetching} onClick={() => void results.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : topics.length === 0 && players.length === 0 ? (
          <EmptyState icon={MagnifyingGlassIcon} title={t('search.noResult', { query: term })} description={t('search.noResultText')} />
        ) : (
          <>
            {topics.length > 0 && (
              <section className="grid gap-3">
                <SectionHeader title={t('nav.topics')} />
                <div className={CARD}>
                  {topics.map((topic, index) => {
                    const name = topic.names ? topicName(topic.names, language) : topic.label
                    return (
                      <TopicRow
                        key={topic.id}
                        title={name}
                        category={toCategoryCode(topic.category)}
                        image={topic.pictogramUrl ?? topic.imageUrl ?? undefined}
                        onClick={() => {
                          remember(name)
                          void navigate(ROUTES.topic(topic.id))
                        }}
                        last={index === topics.length - 1}
                      />
                    )
                  })}
                </div>
              </section>
            )}
            {players.length > 0 && (
              <section className="grid gap-3">
                <SectionHeader title={t('search.players')} />
                <div className={CARD}>
                  {players.map((player, index) => (
                    <PlayerResult
                      key={player.id}
                      player={player}
                      onOpen={() => {
                        remember(player.label)
                        void navigate(ROUTES.player(player.id))
                      }}
                      last={index === players.length - 1}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Screen>
  )
}
