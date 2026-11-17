import type { PageResponse, PeopleSort, PlayerCardView, PlayerProfileView } from '@joutio/client/api-types'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'

type Pages = InfiniteData<PageResponse<PlayerCardView>>
type ContactsKey = ReturnType<typeof queryKeys.contacts.list>

const byPseudonym = (left: PlayerCardView, right: PlayerCardView) => left.pseudonym.localeCompare(right.pseudonym, undefined, { sensitivity: 'base' })
const presenceRank = (card: PlayerCardView) => (card.presence?.status === 'ONLINE' ? 0 : 1)

/** Ordre des listes de personnes, identique au BFF (`ProfileViewService.peopleComparator`) ; `RECENT` : le plus récent en tête. */
const COMPARATORS: Record<PeopleSort, (left: PlayerCardView, right: PlayerCardView) => number> = {
  PRESENCE: (left, right) => presenceRank(left) - presenceRank(right) || byPseudonym(left, right),
  ELO: (left, right) => right.rating - left.rating || byPseudonym(left, right),
  ALPHA: byPseudonym,
  RECENT: () => -1,
}

export const cardOf = (profile: PlayerProfileView): PlayerCardView => ({
  userId: profile.userId,
  pseudonym: profile.pseudonym,
  avatarOptions: profile.avatarOptions,
  rating: profile.progression?.rating ?? 0,
  following: true,
  presence: profile.presence,
  suspended: profile.suspended,
})

/** Insère la carte à sa place dans les pages chargées ; au-delà de la dernière page chargée, la pagination l'apportera. */
function insert(data: Pages, card: PlayerCardView, sort: PeopleSort): Pages {
  const before = COMPARATORS[sort]
  const all = data.pages.flatMap((page) => page.content)
  const index = all.findIndex((item) => before(card, item) < 0)
  const complete = data.pages.at(-1)?.last ?? true
  if (index < 0 && !complete) return { ...data, pages: data.pages.map((page) => ({ ...page, totalElements: page.totalElements + 1 })) }
  let remaining = index < 0 ? all.length : index
  let placed = false
  const pages = data.pages.map((page, pageIndex) => {
    const last = pageIndex === data.pages.length - 1
    let content = page.content
    if (!placed && (remaining < page.content.length || last)) {
      content = [...page.content.slice(0, remaining), card, ...page.content.slice(remaining)]
      placed = true
    } else if (!placed) remaining -= page.content.length
    return { ...page, content, totalElements: page.totalElements + 1 }
  })
  return { ...data, pages }
}

const remove = (data: Pages, userId: string): Pages => {
  if (!data.pages.some((page) => page.content.some((card) => card.userId === userId))) return data
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, content: page.content.filter((card) => card.userId !== userId), totalElements: Math.max(0, page.totalElements - 1) })),
  }
}

/**
 * Abonnement à un joueur, appliqué à toutes les listes de contacts en cache sans les relire : le drapeau `following` de
 * sa carte partout, et sa carte ajoutée à (ou retirée de) mes listes « abonnements » dont la recherche le retient.
 */
export function applyFollow(client: QueryClient, meId: string, profile: PlayerProfileView, follow: boolean) {
  const card = cardOf(profile)
  for (const [key, data] of client.getQueriesData<Pages>({ queryKey: queryKeys.contacts.all })) {
    if (!data) continue
    const [, owner, direction, query, sort] = key as unknown as ContactsKey
    let next: Pages = { ...data, pages: data.pages.map((page) => ({ ...page, content: page.content.map((item) => (item.userId === card.userId ? { ...item, following: follow } : item)) })) }
    if (owner === meId && direction === 'following') {
      const has = next.pages.some((page) => page.content.some((item) => item.userId === card.userId))
      const matches = card.pseudonym.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
      if (follow && !has && matches) next = insert(next, card, sort as PeopleSort)
      if (!follow) next = remove(next, card.userId)
    }
    client.setQueryData(key, next)
  }
}
